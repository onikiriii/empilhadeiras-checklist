using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "MasterReady")]
[Route("api/master/inspetores")]
public class UsuariosInspetoresController : ControllerBase
{
    private static readonly Dictionary<string, ModuloAcesso> AllowedInspectorModules = new(StringComparer.OrdinalIgnoreCase)
    {
        [AccessModuleCatalog.SegurancaTrabalho] = ModuloAcesso.SegurancaTrabalho,
        [AccessModuleCatalog.InspecaoMateriais] = ModuloAcesso.InspecaoMateriais,
    };

    private readonly AppDbContext _db;
    private readonly PasswordHashingService _passwordHashingService;
    private readonly SupervisorLoginGenerator _supervisorLoginGenerator;

    public UsuariosInspetoresController(
        AppDbContext db,
        PasswordHashingService passwordHashingService,
        SupervisorLoginGenerator supervisorLoginGenerator)
    {
        _db = db;
        _passwordHashingService = passwordHashingService;
        _supervisorLoginGenerator = supervisorLoginGenerator;
    }

    [HttpGet]
    public async Task<ActionResult<List<UsuarioSupervisorDto>>> Listar()
    {
        var usuarios = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .Include(x => x.Modulos)
            .Where(x => !x.IsMaster && x.TipoUsuario == UsuarioTipoAcesso.Inspetor)
            .OrderBy(x => x.Setor.Nome)
            .ThenBy(x => x.Nome)
            .ThenBy(x => x.Sobrenome)
            .ToListAsync();

        return Ok(usuarios.Select(AdminUserAccessMapper.ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioSupervisorDto>> Criar([FromBody] CriarInspetorRequest request)
    {
        var validationError = await ValidateCommonDataAsync(
            request.Nome,
            request.Sobrenome,
            request.SetorId,
            request.Email,
            null);

        if (validationError is not null)
            return validationError;

        var senhaError = ValidatePassword(request.Senha, request.ConfirmaSenha, true);
        if (senhaError is not null)
            return senhaError;

        if (!TryParseInspectorModules(request.ModulosDisponiveis, out var modulos, out var modulesError))
            return BadRequest(new { message = modulesError });

        var setor = await _db.Setores
            .AsNoTracking()
            .FirstAsync(x => x.Id == request.SetorId && x.Ativo);

        var usuario = new UsuarioSupervisor
        {
            Nome = request.Nome.Trim(),
            Sobrenome = request.Sobrenome.Trim(),
            Login = await _supervisorLoginGenerator.GenerateUniqueLoginAsync(request.Nome.Trim(), request.Sobrenome.Trim()),
            Email = NormalizeOptionalEmail(request.Email),
            Ramal = NormalizeOptionalText(request.Ramal),
            SenhaHash = _passwordHashingService.HashPassword(request.Senha),
            ForceChangePassword = request.ForceChange,
            IsMaster = false,
            TipoUsuario = UsuarioTipoAcesso.Inspetor,
            SetorId = setor.Id,
            Ativo = true,
            Modulos = AdminUserAccessMapper.BuildModules(Guid.NewGuid(), modulos)
        };

        foreach (var modulo in usuario.Modulos)
            modulo.UsuarioSupervisorId = usuario.Id;

        _db.UsuariosSupervisores.Add(usuario);
        await _db.SaveChangesAsync();

        usuario.Setor = setor;
        return Created("", AdminUserAccessMapper.ToDto(usuario));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UsuarioSupervisorDto>> Atualizar(Guid id, [FromBody] AtualizarInspetorRequest request)
    {
        var usuario = await _db.UsuariosSupervisores
            .Include(x => x.Setor)
            .Include(x => x.Modulos)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsMaster && x.TipoUsuario == UsuarioTipoAcesso.Inspetor);

        if (usuario is null)
            return NotFound(new { message = "Inspetor nao encontrado." });

        var validationError = await ValidateCommonDataAsync(
            request.Nome,
            request.Sobrenome,
            request.SetorId,
            request.Email,
            id);

        if (validationError is not null)
            return validationError;

        var senhaError = ValidatePassword(request.Senha, request.ConfirmaSenha, false);
        if (senhaError is not null)
            return senhaError;

        if (!TryParseInspectorModules(request.ModulosDisponiveis, out var modulos, out var modulesError))
            return BadRequest(new { message = modulesError });

        var setor = await _db.Setores
            .AsNoTracking()
            .FirstAsync(x => x.Id == request.SetorId && x.Ativo);

        usuario.Nome = request.Nome.Trim();
        usuario.Sobrenome = request.Sobrenome.Trim();
        usuario.Login = await _supervisorLoginGenerator.GenerateUniqueLoginAsync(usuario.Nome, usuario.Sobrenome, usuario.Id);
        usuario.Email = NormalizeOptionalEmail(request.Email);
        usuario.Ramal = NormalizeOptionalText(request.Ramal);
        usuario.ForceChangePassword = request.ForceChange;
        usuario.Ativo = request.Ativo;
        usuario.TipoUsuario = UsuarioTipoAcesso.Inspetor;
        usuario.SetorId = setor.Id;

        if (!string.IsNullOrWhiteSpace(request.Senha))
            usuario.SenhaHash = _passwordHashingService.HashPassword(request.Senha!);

        usuario.Modulos.Clear();
        usuario.Modulos.AddRange(AdminUserAccessMapper.BuildModules(usuario.Id, modulos));

        await _db.SaveChangesAsync();

        usuario.Setor = setor;
        return Ok(AdminUserAccessMapper.ToDto(usuario));
    }

    private async Task<ActionResult?> ValidateCommonDataAsync(string nome, string sobrenome, Guid setorId, string? email, Guid? usuarioId)
    {
        if (string.IsNullOrWhiteSpace(nome?.Trim()))
            return BadRequest(new { message = "Nome e obrigatorio." });

        if (string.IsNullOrWhiteSpace(sobrenome?.Trim()))
            return BadRequest(new { message = "Sobrenome e obrigatorio." });

        if (setorId == Guid.Empty)
            return BadRequest(new { message = "Setor e obrigatorio." });

        var normalizedEmail = NormalizeOptionalEmail(email);
        if (!string.IsNullOrWhiteSpace(normalizedEmail))
        {
            var emailExiste = await _db.UsuariosSupervisores.AnyAsync(x => x.Email == normalizedEmail && (!usuarioId.HasValue || x.Id != usuarioId.Value));
            if (emailExiste)
                return Conflict(new { message = "Ja existe um usuario com este email." });
        }

        var setorExiste = await _db.Setores.AnyAsync(x => x.Id == setorId && x.Ativo);
        if (!setorExiste)
            return BadRequest(new { message = "Setor invalido ou inativo." });

        return null;
    }

    private ActionResult? ValidatePassword(string? senha, string? confirmaSenha, bool required)
    {
        if (required && string.IsNullOrWhiteSpace(senha))
            return BadRequest(new { message = "Senha e obrigatoria." });

        if (!string.IsNullOrWhiteSpace(senha) || !string.IsNullOrWhiteSpace(confirmaSenha))
        {
            if (senha != confirmaSenha)
                return BadRequest(new { message = "Senha e confirmacao precisam ser iguais." });

            if ((senha ?? string.Empty).Length < 8)
                return BadRequest(new { message = "A senha precisa ter pelo menos 8 caracteres." });
        }

        return null;
    }

    private static bool TryParseInspectorModules(IReadOnlyList<string>? requestedCodes, out List<ModuloAcesso> modulos, out string errorMessage)
    {
        modulos = [];
        errorMessage = string.Empty;

        if (requestedCodes is null || requestedCodes.Count == 0)
        {
            errorMessage = "Selecione pelo menos um modulo de acesso para o inspetor.";
            return false;
        }

        foreach (var code in requestedCodes.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (!AllowedInspectorModules.TryGetValue(code, out var modulo))
            {
                errorMessage = $"Modulo invalido para inspetor: {code}.";
                return false;
            }

            modulos.Add(modulo);
        }

        if (modulos.Count == 0)
        {
            errorMessage = "Selecione pelo menos um modulo de acesso para o inspetor.";
            return false;
        }

        return true;
    }

    private static string? NormalizeOptionalEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
