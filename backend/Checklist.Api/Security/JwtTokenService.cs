using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Checklist.Api.Models;
using Checklist.Api.Options;
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
            new(CurrentSupervisorClaims.IsMaster, supervisor.IsMaster.ToString().ToLowerInvariant())
        };

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
}
