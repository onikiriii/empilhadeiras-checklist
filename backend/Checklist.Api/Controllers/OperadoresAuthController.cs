using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/operadores-auth")]
public class OperadoresAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordHashingService _passwordHashingService;
    private readonly JwtTokenService _jwtTokenService;

    public OperadoresAuthController(
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
    public async Task<ActionResult<OperadorLoginResponse>> Login([FromBody] OperadorLoginRequest request)
    {
        var login = NormalizeOperatorLogin(request.Login);
        var senha = request.Senha ?? string.Empty;

        if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(senha))
            return BadRequest(new { message = "Login e senha sao obrigatorios." });

        var operador = await _db.Operadores
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Login == login && x.Ativo);

        if (operador is null || !_passwordHashingService.VerifyPassword(senha, operador.SenhaHash))
            return Unauthorized(new { message = "Login ou senha invalidos." });

        if (!operador.Setor.Ativo)
            return Unauthorized(new { message = "O setor deste operador esta inativo." });

        operador.UltimoLoginEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(CreateLoginResponse(operador));
    }

    [Authorize(Policy = "OperatorAuthenticated")]
    [HttpGet("me")]
    public async Task<ActionResult<OperadorLoginResponse>> Me()
    {
        var operadorId = CurrentOperadorClaims.GetOperadorId(User);
        var setorId = CurrentOperadorClaims.GetSetorId(User);

        if (operadorId is null || setorId is null)
            return Unauthorized(new { message = "Token invalido." });

        var operador = await _db.Operadores
            .AsNoTracking()
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Id == operadorId.Value && x.SetorId == setorId.Value && x.Ativo);

        if (operador is null || !operador.Setor.Ativo)
            return Unauthorized(new { message = "Operador nao encontrado ou inativo." });

        return Ok(CreateLoginResponse(operador));
    }

    [Authorize(Policy = "OperatorAuthenticated")]
    [HttpPost("definir-nova-senha")]
    public async Task<ActionResult<OperadorLoginResponse>> DefinirNovaSenha([FromBody] DefinirNovaSenhaOperadorRequest request)
    {
        var operadorId = CurrentOperadorClaims.GetOperadorId(User);
        var setorId = CurrentOperadorClaims.GetSetorId(User);

        if (operadorId is null || setorId is null)
            return Unauthorized(new { message = "Token invalido." });

        var novaSenha = request.NovaSenha ?? string.Empty;
        var confirmacaoSenha = request.ConfirmacaoSenha ?? string.Empty;

        if (string.IsNullOrWhiteSpace(novaSenha))
            return BadRequest(new { message = "Nova senha e obrigatoria." });

        if (novaSenha != confirmacaoSenha)
            return BadRequest(new { message = "Nova senha e confirmacao precisam ser iguais." });

        if (novaSenha.Length < 8)
            return BadRequest(new { message = "A nova senha precisa ter pelo menos 8 caracteres." });

        var operador = await _db.Operadores
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Id == operadorId.Value && x.SetorId == setorId.Value && x.Ativo);

        if (operador is null || !operador.Setor.Ativo)
            return Unauthorized(new { message = "Operador nao encontrado ou inativo." });

        operador.SenhaHash = _passwordHashingService.HashPassword(novaSenha);
        operador.ForceChangePassword = false;
        operador.UltimoLoginEm = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(CreateLoginResponse(operador));
    }

    private OperadorLoginResponse CreateLoginResponse(Models.Operador operador)
    {
        var token = _jwtTokenService.GenerateOperatorToken(operador);
        var expiresAtUtc = _jwtTokenService.GetExpirationUtc();

        return new OperadorLoginResponse(
            token,
            expiresAtUtc,
            new OperadorAuthDto(
                operador.Id,
                operador.Nome,
                operador.Matricula,
                operador.SetorId,
                operador.Setor.Nome,
                operador.ForceChangePassword
            )
        );
    }

    private static string NormalizeOperatorLogin(string? value)
    {
        return SupervisorLoginGenerator.NormalizeToLogin(value ?? string.Empty).Trim().ToLowerInvariant();
    }
}
