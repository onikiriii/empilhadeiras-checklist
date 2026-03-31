using System.Security.Claims;

namespace Checklist.Api.Security;

public static class CurrentSupervisorClaims
{
    public const string SetorId = "setor_id";
    public const string SupervisorId = "supervisor_id";
    public const string ForceChangePassword = "force_change_password";
    public const string IsMaster = "is_master";

    public static Guid? GetSetorId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(SetorId);
        return Guid.TryParse(value, out var setorId) ? setorId : null;
    }

    public static Guid? GetSupervisorId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(SupervisorId);
        return Guid.TryParse(value, out var supervisorId) ? supervisorId : null;
    }

    public static bool GetForceChangePassword(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ForceChangePassword);
        return bool.TryParse(value, out var forceChangePassword) && forceChangePassword;
    }

    public static bool GetIsMaster(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(IsMaster);
        return bool.TryParse(value, out var isMaster) && isMaster;
    }
}
