using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/operadores")]
public class OperadoresController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordHashingService _passwordHashingService;

    public OperadoresController(AppDbContext db, PasswordHashingService passwordHashingService)
    {
        _db = db;
        _passwordHashingService = passwordHashingService;
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpGet]
    public async Task<ActionResult<List<OperadorDto>>> Listar([FromQuery] bool? ativos = null)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var query = _db.Operadores
            .AsNoTracking()
            .Where(o => o.SetorId == setorId.Value);

        if (ativos is not null)
            query = query.Where(o => o.Ativo == ativos.Value);

        var lista = await query
            .OrderBy(o => o.Matricula)
            .Select(o => ToDto(o))
            .ToListAsync();

        return Ok(lista);
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpGet("{matricula}")]
    public async Task<ActionResult<OperadorDto>> ObterPorMatricula(string matricula)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        matricula = (matricula ?? string.Empty).Trim();

        var op = await _db.Operadores
            .AsNoTracking()
            .Where(o => o.Matricula == matricula && o.SetorId == setorId.Value)
            .Select(o => ToDto(o))
            .FirstOrDefaultAsync();

        return op is null ? NotFound(new { message = "Operador nao encontrado." }) : Ok(op);
    }

    [AllowAnonymous]
    [HttpGet("busca")]
    public async Task<ActionResult<List<object>>> Buscar([FromQuery] string query, [FromQuery] Guid setorId, [FromQuery] int take = 10)
    {
        if (setorId == Guid.Empty)
            return BadRequest(new { message = "setorId e obrigatorio para busca operacional." });

        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return Ok(new List<object>());

        var normalizedQuery = query.Trim().ToLowerInvariant();

        var operadores = await _db.Operadores
            .AsNoTracking()
            .Where(o => o.SetorId == setorId &&
                        o.Ativo &&
                        (o.Nome.ToLower().Contains(normalizedQuery) ||
                         o.Matricula.Contains(query)))
            .OrderBy(o => o.Nome)
            .Take(take)
            .Select(o => new
            {
                o.Id,
                o.SetorId,
                o.Nome,
                o.Matricula
            })
            .ToListAsync();

        return Ok(operadores);
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpPost]
    public async Task<ActionResult<OperadorDto>> Criar([FromBody] CriarOperadorRequest req)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var validationError = await ValidateCreateOrUpdateAsync(
            setorId.Value,
            req.Matricula,
            req.Nome,
            req.Login,
            req.Senha,
            req.ConfirmaSenha,
            null);

        if (validationError is not null)
            return validationError;

        var op = new Operador
        {
            SetorId = setorId.Value,
            Matricula = req.Matricula.Trim(),
            Nome = req.Nome.Trim(),
            Login = NormalizeOperatorLogin(req.Login),
            SenhaHash = _passwordHashingService.HashPassword(req.Senha),
            ForceChangePassword = req.ForceChangePassword,
            Ativo = true
        };

        _db.Operadores.Add(op);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorMatricula), new { matricula = op.Matricula }, ToDto(op));
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<OperadorDto>> Atualizar(Guid id, [FromBody] AtualizarOperadorRequest req)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var op = await _db.Operadores.FirstOrDefaultAsync(o => o.Id == id && o.SetorId == setorId.Value);
        if (op is null)
            return NotFound(new { message = "Operador nao encontrado." });

        var validationError = await ValidateCreateOrUpdateAsync(
            setorId.Value,
            op.Matricula,
            req.Nome,
            req.Login,
            req.Senha,
            req.ConfirmaSenha,
            op.Id);

        if (validationError is not null)
            return validationError;

        op.Nome = req.Nome.Trim();
        op.Login = NormalizeOperatorLogin(req.Login);
        op.Ativo = req.Ativo;
        op.ForceChangePassword = req.ForceChangePassword;

        if (!string.IsNullOrWhiteSpace(req.Senha))
        {
            op.SenhaHash = _passwordHashingService.HashPassword(req.Senha);
            op.ForceChangePassword = true;
        }

        await _db.SaveChangesAsync();

        return Ok(ToDto(op));
    }

    private async Task<ActionResult?> ValidateCreateOrUpdateAsync(
        Guid setorId,
        string? matricula,
        string? nome,
        string? login,
        string? senha,
        string? confirmaSenha,
        Guid? operadorId)
    {
        var normalizedMatricula = (matricula ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedMatricula))
            return BadRequest(new { message = "Matricula e obrigatoria." });

        var normalizedNome = (nome ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedNome))
            return BadRequest(new { message = "Nome e obrigatorio." });

        var normalizedLogin = NormalizeOperatorLogin(login);
        if (string.IsNullOrWhiteSpace(normalizedLogin))
            return BadRequest(new { message = "Login e obrigatorio." });

        var loginExiste = await _db.Operadores.AnyAsync(x =>
            x.Login == normalizedLogin &&
            (!operadorId.HasValue || x.Id != operadorId.Value));

        if (loginExiste)
            return Conflict(new { message = "Ja existe operador com este login." });

        var matriculaExiste = await _db.Operadores.AnyAsync(x =>
            x.Matricula == normalizedMatricula &&
            x.SetorId == setorId &&
            (!operadorId.HasValue || x.Id != operadorId.Value));

        if (matriculaExiste)
            return Conflict(new { message = $"Ja existe operador com matricula '{normalizedMatricula}' neste setor." });

        var senhaInformada = !string.IsNullOrWhiteSpace(senha) || !string.IsNullOrWhiteSpace(confirmaSenha);
        if (!operadorId.HasValue && string.IsNullOrWhiteSpace(senha))
            return BadRequest(new { message = "Senha e obrigatoria." });

        if (senhaInformada)
        {
            if (senha != confirmaSenha)
                return BadRequest(new { message = "Senha e confirmacao precisam ser iguais." });

            if ((senha ?? string.Empty).Length < 8)
                return BadRequest(new { message = "A senha precisa ter pelo menos 8 caracteres." });
        }

        return null;
    }

    private static string NormalizeOperatorLogin(string? value)
    {
        return SupervisorLoginGenerator.NormalizeToLogin(value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static OperadorDto ToDto(Operador operador)
    {
        return new OperadorDto(
            operador.Id,
            operador.SetorId,
            operador.Matricula,
            operador.Nome,
            operador.Login,
            operador.ForceChangePassword,
            operador.Ativo);
    }
}
