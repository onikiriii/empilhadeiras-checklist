using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Checklist.Api.Models;
using Checklist.Api.Options;
using Checklist.Api.Support;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Checklist.Api.Security;

public class JwtTokenService
{
    private readonly AuthOptions _authOptions;

    public JwtTokenService(IOptions<AuthOptions> authOptions)
    {
        _authOptions = authOptions.Value;
    }

    public DateTime GetExpirationUtc() => DateTime.UtcNow.AddMinutes(_authOptions.TokenExpirationMinutes);

    public string GenerateToken(UsuarioSupervisor supervisor)
    {
        var expiresAt = GetExpirationUtc();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authOptions.JwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, supervisor.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, supervisor.Login),
            new(CurrentSupervisorClaims.SupervisorId, supervisor.Id.ToString()),
            new(CurrentSupervisorClaims.SetorId, supervisor.SetorId.ToString()),
            new(CurrentSupervisorClaims.ForceChangePassword, supervisor.ForceChangePassword.ToString().ToLowerInvariant()),
            new(CurrentSupervisorClaims.IsMaster, supervisor.IsMaster.ToString().ToLowerInvariant()),
            new(CurrentSupervisorClaims.UserType, supervisor.TipoUsuario.ToString())
        };

        foreach (var modulo in supervisor.Modulos)
            claims.Add(new Claim(CurrentSupervisorClaims.AccessModule, AccessModuleCatalog.ToCode(modulo.Modulo)));

        if (!string.IsNullOrWhiteSpace(supervisor.Email))
            claims.Add(new Claim(JwtRegisteredClaimNames.Email, supervisor.Email));

        var token = new JwtSecurityToken(
            issuer: _authOptions.Issuer,
            audience: _authOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateOperatorToken(Operador operador)
    {
        var expiresAt = GetExpirationUtc();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authOptions.JwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, operador.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, operador.Login),
            new(CurrentOperadorClaims.OperadorId, operador.Id.ToString()),
            new(CurrentOperadorClaims.SetorId, operador.SetorId.ToString()),
            new(CurrentOperadorClaims.ForceChangePassword, operador.ForceChangePassword.ToString().ToLowerInvariant())
        };

        var token = new JwtSecurityToken(
            issuer: _authOptions.Issuer,
            audience: _authOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
