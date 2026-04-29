using System.Security.Claims;

namespace Checklist.Api.Security;

public static class CurrentOperadorClaims
{
    public const string OperadorId = "operador_id";
    public const string SetorId = "operador_setor_id";
    public const string ForceChangePassword = "operador_force_change_password";

    public static Guid? GetOperadorId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(OperadorId);
        return Guid.TryParse(value, out var operadorId) ? operadorId : null;
    }

    public static Guid? GetSetorId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(SetorId);
        return Guid.TryParse(value, out var setorId) ? setorId : null;
    }

    public static bool GetForceChangePassword(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ForceChangePassword);
        return bool.TryParse(value, out var forceChangePassword) && forceChangePassword;
    }
}
