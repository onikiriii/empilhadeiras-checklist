using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "MasterReady")]
[Route("api/master/supervisores")]
public class UsuariosSupervisoresController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordHashingService _passwordHashingService;
    private readonly SupervisorLoginGenerator _supervisorLoginGenerator;

    public UsuariosSupervisoresController(
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
            .Where(x => !x.IsMaster)
            .OrderBy(x => x.Setor.Nome)
            .ThenBy(x => x.Nome)
            .ThenBy(x => x.Sobrenome)
            .Select(x => new UsuarioSupervisorDto(
                x.Id,
                x.Nome,
                x.Sobrenome,
                $"{x.Nome} {x.Sobrenome}",
                x.Login,
                x.Ramal,
                x.Email,
                x.ForceChangePassword,
                x.IsMaster,
                x.Ativo,
                x.SetorId,
                x.Setor.Nome
            ))
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioSupervisorDto>> Criar([FromBody] CriarUsuarioSupervisorRequest request)
    {
        var nome = (request.Nome ?? string.Empty).Trim();
        var sobrenome = (request.Sobrenome ?? string.Empty).Trim();
        var senha = request.Senha ?? string.Empty;
        var confirmaSenha = request.ConfirmaSenha ?? string.Empty;
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant();
        var ramal = string.IsNullOrWhiteSpace(request.Ramal) ? null : request.Ramal.Trim();

        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome e obrigatorio." });

        if (string.IsNullOrWhiteSpace(sobrenome))
            return BadRequest(new { message = "Sobrenome e obrigatorio." });

        if (string.IsNullOrWhiteSpace(senha))
            return BadRequest(new { message = "Senha e obrigatoria." });

        if (senha != confirmaSenha)
            return BadRequest(new { message = "Senha e confirmacao precisam ser iguais." });

        if (senha.Length < 8)
            return BadRequest(new { message = "A senha precisa ter pelo menos 8 caracteres." });

        if (request.SetorId == Guid.Empty)
            return BadRequest(new { message = "Setor e obrigatorio." });

        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailExiste = await _db.UsuariosSupervisores.AnyAsync(x => x.Email == email);
            if (emailExiste)
                return Conflict(new { message = "Ja existe um supervisor com este email." });
        }

        var setor = await _db.Setores
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.SetorId && x.Ativo);

        if (setor is null)
            return BadRequest(new { message = "Setor invalido ou inativo." });

        var login = await _supervisorLoginGenerator.GenerateUniqueLoginAsync(nome, sobrenome);

        var usuario = new UsuarioSupervisor
        {
            Nome = nome,
            Sobrenome = sobrenome,
            Login = login,
            Email = email,
            Ramal = ramal,
            SenhaHash = _passwordHashingService.HashPassword(senha),
            ForceChangePassword = request.ForceChange,
            IsMaster = false,
            SetorId = setor.Id,
            Ativo = true
        };

        _db.UsuariosSupervisores.Add(usuario);
        await _db.SaveChangesAsync();

        return Created("", new UsuarioSupervisorDto(
            usuario.Id,
            usuario.Nome,
            usuario.Sobrenome,
            $"{usuario.Nome} {usuario.Sobrenome}",
            usuario.Login,
            usuario.Ramal,
            usuario.Email,
            usuario.ForceChangePassword,
            usuario.IsMaster,
            usuario.Ativo,
            usuario.SetorId,
            setor.Nome
        ));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UsuarioSupervisorDto>> Atualizar(Guid id, [FromBody] AtualizarUsuarioSupervisorRequest request)
    {
        var nome = (request.Nome ?? string.Empty).Trim();
        var sobrenome = (request.Sobrenome ?? string.Empty).Trim();
        var senha = request.Senha ?? string.Empty;
        var confirmaSenha = request.ConfirmaSenha ?? string.Empty;
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant();
        var ramal = string.IsNullOrWhiteSpace(request.Ramal) ? null : request.Ramal.Trim();

        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome e obrigatorio." });

        if (string.IsNullOrWhiteSpace(sobrenome))
            return BadRequest(new { message = "Sobrenome e obrigatorio." });

        if (request.SetorId == Guid.Empty)
            return BadRequest(new { message = "Setor e obrigatorio." });

        if (!string.IsNullOrWhiteSpace(senha) || !string.IsNullOrWhiteSpace(confirmaSenha))
        {
            if (senha != confirmaSenha)
                return BadRequest(new { message = "Senha e confirmacao precisam ser iguais." });

            if (senha.Length < 8)
                return BadRequest(new { message = "A senha precisa ter pelo menos 8 caracteres." });
        }

        var usuario = await _db.UsuariosSupervisores
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsMaster);

        if (usuario is null)
            return NotFound(new { message = "Supervisor nao encontrado." });

        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailExiste = await _db.UsuariosSupervisores.AnyAsync(x => x.Email == email && x.Id != id);
            if (emailExiste)
                return Conflict(new { message = "Ja existe um supervisor com este email." });
        }

        var setor = await _db.Setores
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.SetorId && x.Ativo);

        if (setor is null)
            return BadRequest(new { message = "Setor invalido ou inativo." });

        usuario.Nome = nome;
        usuario.Sobrenome = sobrenome;
        usuario.Login = await _supervisorLoginGenerator.GenerateUniqueLoginAsync(nome, sobrenome, usuario.Id);
        usuario.Email = email;
        usuario.Ramal = ramal;
        usuario.ForceChangePassword = request.ForceChange;
        usuario.Ativo = request.Ativo;
        usuario.SetorId = setor.Id;

        if (!string.IsNullOrWhiteSpace(senha))
            usuario.SenhaHash = _passwordHashingService.HashPassword(senha);

        await _db.SaveChangesAsync();

        return Ok(new UsuarioSupervisorDto(
            usuario.Id,
            usuario.Nome,
            usuario.Sobrenome,
            $"{usuario.Nome} {usuario.Sobrenome}",
            usuario.Login,
            usuario.Ramal,
            usuario.Email,
            usuario.ForceChangePassword,
            usuario.IsMaster,
            usuario.Ativo,
            usuario.SetorId,
            setor.Nome
        ));
    }
}
