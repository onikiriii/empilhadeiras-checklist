using Checklist.Api.Controllers.Features.Supervisor.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Checklist.Api.Controllers.Features.Supervisor.Dashboard;

[ApiController]
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor")]
public class SupervisorDashboardController : ControllerBase
{
    private readonly SupervisorDashboardQueryService _queryService;

    public SupervisorDashboardController(SupervisorDashboardQueryService queryService)
    {
        _queryService = queryService;
    }

    [HttpGet("equipamentos-status")]
    public async Task<ActionResult<List<EquipamentoStatusDto>>> ObterStatusEquipamentos()
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.GetEquipamentosStatusAsync(context!);
        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<List<SupervisorDashboardItemDto>>> GetDashboard()
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.GetDashboardAsync(context!);
        return Ok(result);
    }
}
