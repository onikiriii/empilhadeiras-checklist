using Checklist.Api.Controllers.Features.Supervisor.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

[ApiController]
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor")]
public class SupervisorNaoOkWorkflowController : ControllerBase
{
    private readonly SupervisorNaoOkWorkflowService _workflowService;

    public SupervisorNaoOkWorkflowController(SupervisorNaoOkWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpPost("itens-nao-ok/{checklistItemId:guid}/atribuir")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> AprovarEAtribuirItemNaoOk(
        Guid checklistItemId,
        [FromBody] AtribuirItemNaoOkRequest request)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _workflowService.AtribuirAsync(context!, checklistItemId, request);
        return ToActionResult(result);
    }

    [HttpPut("itens-nao-ok/{checklistItemId:guid}/tratativa")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> AtualizarTratativaItemNaoOk(
        Guid checklistItemId,
        [FromBody] AtualizarTratativaItemNaoOkRequest request)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _workflowService.AtualizarTratativaAsync(context!, checklistItemId, request);
        return ToActionResult(result);
    }

    [HttpPost("itens-nao-ok/{checklistItemId:guid}/concluir")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> ConcluirItemNaoOk(Guid checklistItemId)
    {
        if (!SupervisorAuthorizationHelper.TryBuildContext(User, out var context, out var error))
            return error!;

        var result = await _workflowService.ConcluirAsync(context!, checklistItemId);
        return ToActionResult(result);
    }

    private ActionResult<T> ToActionResult<T>(SupervisorOperationResult<T> result)
    {
        if (result.Success)
            return Ok(result.Value);

        return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
    }
}
