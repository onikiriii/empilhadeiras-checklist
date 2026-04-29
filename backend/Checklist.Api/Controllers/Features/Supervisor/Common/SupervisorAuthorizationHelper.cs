using System.Security.Claims;
using Checklist.Api.Security;
using Microsoft.AspNetCore.Mvc;

namespace Checklist.Api.Controllers.Features.Supervisor.Common;

public static class SupervisorAuthorizationHelper
{
    public static bool TryBuildContext(
        ClaimsPrincipal user,
        out SupervisorContext? context,
        out ActionResult? errorResult)
    {
        context = null;
        errorResult = null;

        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(user);
        var setorId = CurrentSupervisorClaims.GetSetorId(user);

        if (supervisorId is null || setorId is null)
        {
            errorResult = new UnauthorizedObjectResult(new
            {
                message = "Supervisor sem contexto válido."
            });

            return false;
        }

        context = new SupervisorContext(
            supervisorId.Value,
            setorId.Value
        );

        return true;
    }
}
