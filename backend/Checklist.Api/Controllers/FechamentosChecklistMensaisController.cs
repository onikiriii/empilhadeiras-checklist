using Checklist.Api.Dtos;
using Checklist.Api.Security;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor/fechamentos-mensais")]
public class FechamentosChecklistMensaisController : ControllerBase
{
    private readonly ChecklistMonthlyClosingService _closingService;

    public FechamentosChecklistMensaisController(ChecklistMonthlyClosingService closingService)
    {
        _closingService = closingService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FechamentoChecklistMensalResumoDto>>> Listar(
        [FromQuery] int? ano,
        [FromQuery] int? mes,
        [FromQuery] Guid? equipamentoId)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        return Ok(await _closingService.ListarAsync(setorId.Value, ano, mes, equipamentoId));
    }

    [HttpGet("preview")]
    public async Task<ActionResult<FechamentoChecklistMensalPreviewDto>> Preview(
        [FromQuery] Guid equipamentoId,
        [FromQuery] int ano,
        [FromQuery] int mes)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        if (equipamentoId == Guid.Empty || ano < 2000 || mes is < 1 or > 12)
            return BadRequest(new { message = "Equipamento, ano e mes sao obrigatorios." });

        try
        {
            return Ok(await _closingService.BuildPreviewAsync(setorId.Value, equipamentoId, ano, mes));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("fechar")]
    public async Task<ActionResult<FechamentoChecklistMensalResumoDto>> Fechar([FromBody] FecharChecklistMensalRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (setorId is null || supervisorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var preview = await _closingService.BuildPreviewAsync(setorId.Value, request.EquipamentoId, request.Ano, request.Mes);
        if (preview.JaFechado)
            return Conflict(new { message = "Este mes ja foi fechado para o equipamento selecionado.", fechamentoId = preview.FechamentoId });

        try
        {
            var fechamento = await _closingService.CloseAsync(setorId.Value, supervisorId.Value, request.EquipamentoId, request.Ano, request.Mes);
            return Ok(new FechamentoChecklistMensalResumoDto(
                fechamento.Id,
                fechamento.EquipamentoId,
                preview.EquipamentoCodigo,
                preview.EquipamentoDescricao,
                fechamento.Ano,
                fechamento.Mes,
                fechamento.QuantidadeChecklists,
                fechamento.TemplateVersao,
                fechamento.NomeArquivoPdf,
                fechamento.FechadoEm,
                User.Identity?.Name ?? "Supervisor"
            ));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var fechamento = await _closingService.GetClosingAsync(setorId.Value, id);
        if (fechamento is null)
            return NotFound(new { message = "Fechamento mensal nao encontrado." });

        return File(fechamento.PdfConteudo, "application/pdf", fechamento.NomeArquivoPdf);
    }
}
