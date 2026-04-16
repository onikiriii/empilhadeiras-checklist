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
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordHashingService _passwordHashingService;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(
        AppDbContext db,
        PasswordHashingService passwordHashingService,
        JwtTokenService jwtTokenService)
    {
        _db = db;
        _passwordHashingService = passwordHashingService;
        _jwtTokenService = jwtTokenService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginSupervisorResponse>> Login([FromBody] LoginSupervisorRequest request)
    {
        var login = SupervisorLoginGenerator.NormalizeToLogin(request.Login ?? string.Empty);
        var senha = request.Senha ?? string.Empty;

        if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(senha))
            return BadRequest(new { message = "Login e senha sao obrigatorios." });

        var supervisor = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .Include(x => x.Modulos)
            .FirstOrDefaultAsync(x => x.Login == login && x.Ativo);

        if (supervisor is null || !_passwordHashingService.VerifyPassword(senha, supervisor.SenhaHash))
            return Unauthorized(new { message = "Login ou senha invalidos." });

        if (!supervisor.IsMaster && !supervisor.Setor.Ativo)
            return Unauthorized(new { message = "O setor deste supervisor esta inativo." });

        return Ok(CreateLoginResponse(supervisor));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<LoginSupervisorResponse>> Me()
    {
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        var setorId = CurrentSupervisorClaims.GetSetorId(User);

        if (supervisorId is null || setorId is null)
            return Unauthorized(new { message = "Token invalido." });

        var supervisor = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .Include(x => x.Modulos)
            .FirstOrDefaultAsync(x => x.Id == supervisorId.Value && x.SetorId == setorId.Value && x.Ativo);

        if (supervisor is null || (!supervisor.IsMaster && !supervisor.Setor.Ativo))
            return Unauthorized(new { message = "Supervisor nao encontrado ou inativo." });

        return Ok(CreateLoginResponse(supervisor));
    }

    [Authorize]
    [HttpPost("definir-nova-senha")]
    public async Task<ActionResult<LoginSupervisorResponse>> DefinirNovaSenha([FromBody] DefinirNovaSenhaRequest request)
    {
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        var setorId = CurrentSupervisorClaims.GetSetorId(User);

        if (supervisorId is null || setorId is null)
            return Unauthorized(new { message = "Token invalido." });

        var novaSenha = request.NovaSenha ?? string.Empty;
        var confirmacaoSenha = request.ConfirmacaoSenha ?? string.Empty;

        if (string.IsNullOrWhiteSpace(novaSenha))
            return BadRequest(new { message = "Nova senha e obrigatoria." });

        if (novaSenha != confirmacaoSenha)
            return BadRequest(new { message = "Nova senha e confirmacao precisam ser iguais." });

        if (novaSenha.Length < 8)
            return BadRequest(new { message = "A nova senha precisa ter pelo menos 8 caracteres." });

        var supervisor = await _db.UsuariosSupervisores
            .Include(x => x.Setor)
            .Include(x => x.Modulos)
            .FirstOrDefaultAsync(x => x.Id == supervisorId.Value && x.SetorId == setorId.Value && x.Ativo);

        if (supervisor is null || (!supervisor.IsMaster && !supervisor.Setor.Ativo))
            return Unauthorized(new { message = "Supervisor nao encontrado ou inativo." });

        supervisor.SenhaHash = _passwordHashingService.HashPassword(novaSenha);
        supervisor.ForceChangePassword = false;

        await _db.SaveChangesAsync();

        return Ok(CreateLoginResponse(supervisor));
    }

    private LoginSupervisorResponse CreateLoginResponse(Models.UsuarioSupervisor supervisor)
    {
        var token = _jwtTokenService.GenerateToken(supervisor);
        var expiresAtUtc = _jwtTokenService.GetExpirationUtc();

        return new LoginSupervisorResponse(
            token,
            expiresAtUtc,
            new SupervisorAuthDto(
                supervisor.Id,
                supervisor.Nome,
                supervisor.Sobrenome,
                $"{supervisor.Nome} {supervisor.Sobrenome}",
                supervisor.Login,
                supervisor.Email,
                supervisor.Ramal,
                supervisor.SetorId,
                supervisor.Setor.Nome,
                supervisor.ForceChangePassword,
                supervisor.IsMaster,
                supervisor.TipoUsuario,
                BuildModulosDisponiveis(supervisor)
            )
        );
    }

    private static IReadOnlyList<string> BuildModulosDisponiveis(Models.UsuarioSupervisor supervisor)
    {
        if (supervisor.IsMaster)
            return [];

        return AccessModuleCatalog.ToCodes(supervisor.Modulos);
    }
}
