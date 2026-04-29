using Checklist.Api.Controllers.Features.Supervisor.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

[ApiController]
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor")]
public class SupervisorNaoOkQueriesController : ControllerBase
{
    private readonly SupervisorNaoOkQueryService _queryService;

    public SupervisorNaoOkQueriesController(SupervisorNaoOkQueryService queryService)
    {
        _queryService = queryService;
    }

    [HttpGet("itens-nao-ok")]
    public async Task<ActionResult<List<ItemNaoOkDto>>> ListarItensNaoOk(
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] string? equipamento,
        [FromQuery] string? operador)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.ListarItensNaoOkAsync(
            context!,
            new ItemNaoOkFiltersDto(dataInicio, dataFim, equipamento, operador));

        return Ok(result);
    }

    [HttpGet("itens-nao-ok/painel")]
    public async Task<ActionResult<ItemNaoOkPainelDto>> ObterPainelItensNaoOk(
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] string? equipamento,
        [FromQuery] string? operador)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.ObterPainelAsync(
            context!,
            new ItemNaoOkFiltersDto(dataInicio, dataFim, equipamento, operador));

        return Ok(result);
    }

    [HttpGet("itens-nao-ok/responsaveis")]
    public async Task<ActionResult<List<SupervisorResponsavelOptionDto>>> ListarResponsaveisItensNaoOk()
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.ListarResponsaveisAsync(context!);
        return Ok(result);
    }

    [HttpGet("itens-nao-ok/{checklistItemId:guid}")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> ObterItemNaoOk(Guid checklistItemId)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _queryService.ObterItemAsync(context!, checklistItemId);
        return ToActionResult(result);
    }

    private ActionResult<T> ToActionResult<T>(SupervisorOperationResult<T> result)
    {
        if (result.Success)
            return Ok(result.Value);

        return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
    }
}
