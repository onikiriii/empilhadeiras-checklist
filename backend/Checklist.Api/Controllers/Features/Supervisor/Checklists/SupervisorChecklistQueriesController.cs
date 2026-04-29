using Checklist.Api.Controllers.Features.Supervisor.Common;
using Checklist.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Checklist.Api.Controllers.Features.Supervisor.Checklists;

[ApiController]
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor")]
public class SupervisorChecklistQueriesController : ControllerBase
{
    private readonly SupervisorChecklistQueryService _queryService;

    public SupervisorChecklistQueriesController(SupervisorChecklistQueryService queryService)
    {
        _queryService = queryService;
    }

    [HttpGet("checklist/{codigo}/hoje")]
    public async Task<ActionResult<ChecklistDto>> ObterChecklistHoje(string codigo)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.ObterChecklistHojeAsync(context!, codigo);
        return ToActionResult(result);
    }

    [HttpGet("checklists")]
    public async Task<ActionResult<List<SupervisorChecklistListItemDto>>> ListarChecklists(
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] string? status,
        [FromQuery] string? operador)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.ListarChecklistsAsync(
            context!,
            new SupervisorChecklistFiltersDto(dataInicio, dataFim, status, operador));

        return Ok(result);
    }

    private ActionResult<T> ToActionResult<T>(SupervisorOperationResult<T> result)
    {
        if (result.Success)
            return Ok(result.Value);

        return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
    }
}
