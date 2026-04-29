using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "SafetyWorkReady")]
[Route("api/stp")]
public class StpController : ControllerBase
{
    private readonly AppDbContext _db;

    public StpController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("templates")]
    public async Task<ActionResult<IReadOnlyList<StpAreaChecklistTemplateSummaryDto>>> ListarTemplatesAtivos()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var templates = await _db.StpAreaChecklistTemplates
            .AsNoTracking()
            .Where(x => x.SetorId == setorId.Value && x.Ativo)
            .OrderBy(x => x.Codigo)
            .ThenBy(x => x.Nome)
            .Select(x => new StpAreaChecklistTemplateSummaryDto(
                x.Id,
                x.SetorId,
                x.Codigo,
                x.Nome,
                x.Ativo,
                x.Itens.Count(i => i.Ativo)
            ))
            .ToListAsync();

        return Ok(templates);
    }

    [HttpGet("templates/{id:guid}")]
    public async Task<ActionResult<StpAreaChecklistTemplateDetailDto>> ObterTemplate(Guid id)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var template = await _db.StpAreaChecklistTemplates
            .AsNoTracking()
            .Include(x => x.Itens)
            .FirstOrDefaultAsync(x => x.Id == id && x.SetorId == setorId.Value && x.Ativo);

        if (template is null)
            return NotFound(new { message = "Template STP nao encontrado." });

        return Ok(ToTemplateDetailDto(template));
    }

    [HttpGet("checklists")]
    public async Task<ActionResult<IReadOnlyList<StpAreaChecklistListItemDto>>> ListarChecklists(
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] string? responsavel)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var query = _db.StpAreaChecklists
            .AsNoTracking()
            .Include(x => x.Template)
            .Include(x => x.InspetorSupervisor)
            .Include(x => x.AreaInspecao)
                .ThenInclude(x => x!.ResponsavelSupervisor)
            .Include(x => x.SetorInspecionado)
            .Include(x => x.Itens)
            .Where(x => x.SetorId == setorId.Value)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(dataInicio))
        {
            var inicio = DateTime.Parse(dataInicio);
            var inicioUtc = new DateTime(inicio.Year, inicio.Month, inicio.Day, 0, 0, 0, DateTimeKind.Utc);
            query = query.Where(x => x.DataReferencia >= inicioUtc);
        }

        if (!string.IsNullOrWhiteSpace(dataFim))
        {
            var fim = DateTime.Parse(dataFim);
            var fimUtc = new DateTime(fim.Year, fim.Month, fim.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            query = query.Where(x => x.DataReferencia < fimUtc);
        }

        if (!string.IsNullOrWhiteSpace(responsavel))
        {
            var filtro = responsavel.Trim().ToLower();
            query = query.Where(x => x.ResponsavelPresenteNome.ToLower().Contains(filtro));
        }

        var list = await query
            .OrderByDescending(x => x.DataRealizacao)
            .Select(x => new StpAreaChecklistListItemDto(
                x.Id,
                x.TemplateId,
                x.Template.Codigo,
                x.Template.Nome,
                x.DataRealizacao,
                x.InspetorSupervisor.Nome + " " + x.InspetorSupervisor.Sobrenome,
                x.AreaInspecaoId,
                x.AreaInspecao != null ? x.AreaInspecao.Nome : x.SetorInspecionado.Nome,
                x.AreaInspecao != null ? x.AreaInspecao.ResponsavelSupervisorId : null,
                x.AreaInspecao != null
                    ? x.AreaInspecao.ResponsavelSupervisor.Nome + " " + x.AreaInspecao.ResponsavelSupervisor.Sobrenome
                    : x.ResponsavelPresenteNome,
                x.Itens.Count,
                x.Itens.Count(i => i.Resultado == StpAreaChecklistResultado.Check),
                x.Itens.Count(i => i.Resultado == StpAreaChecklistResultado.X)
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("checklists/{id:guid}")]
    public async Task<ActionResult<StpAreaChecklistDetailDto>> ObterChecklist(Guid id)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var checklist = await _db.StpAreaChecklists
            .AsNoTracking()
            .Include(x => x.Template)
            .Include(x => x.InspetorSupervisor)
            .Include(x => x.AreaInspecao)
                .ThenInclude(x => x!.ResponsavelSupervisor)
            .Include(x => x.SetorInspecionado)
            .Include(x => x.Itens)
            .FirstOrDefaultAsync(x => x.Id == id && x.SetorId == setorId.Value);

        if (checklist is null)
            return NotFound(new { message = "Checklist STP nao encontrado." });

        return Ok(ToChecklistDetailDto(checklist));
    }

    [HttpPost("checklists")]
    public async Task<ActionResult<StpAreaChecklistDetailDto>> CriarChecklist([FromBody] EnviarStpAreaChecklistRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);

        if (setorId is null || supervisorId is null)
            return Unauthorized(new { message = "Supervisor sem contexto valido." });

        if (request.TemplateId == Guid.Empty)
            return BadRequest(new { message = "TemplateId e obrigatorio." });

        if (request.AreaInspecaoId == Guid.Empty)
            return BadRequest(new { message = "A área de inspeção é obrigatória." });

        if (request.Itens is null || request.Itens.Count == 0)
            return BadRequest(new { message = "A inspecao STP precisa ter itens preenchidos." });

        if (!IsValidSignaturePayload(request.AssinaturaInspetorBase64) || !IsValidSignaturePayload(request.AssinaturaResponsavelPresenteBase64))
            return BadRequest(new { message = "As duas assinaturas sao obrigatorias e precisam estar em formato valido." });

        var areaInspecao = await _db.StpAreasInspecao
            .AsNoTracking()
            .Include(x => x.ResponsavelSupervisor)
            .FirstOrDefaultAsync(x => x.Id == request.AreaInspecaoId && x.SetorId == setorId.Value && x.Ativa);

        if (areaInspecao is null)
            return BadRequest(new { message = "A área de inspeção informada é inválida, inativa ou fora do setor." });

        var template = await _db.StpAreaChecklistTemplates
            .Include(x => x.Itens)
            .FirstOrDefaultAsync(x => x.Id == request.TemplateId && x.SetorId == setorId.Value && x.Ativo);

        if (template is null)
            return BadRequest(new { message = "Template STP invalido ou indisponivel para o setor." });

        var templateItems = template.Itens
            .Where(x => x.Ativo)
            .OrderBy(x => x.Ordem)
            .ToList();

        if (templateItems.Count == 0)
            return BadRequest(new { message = "O template STP nao possui itens ativos." });

        var requestItemsById = request.Itens
            .GroupBy(x => x.TemplateItemId)
            .ToDictionary(x => x.Key, x => x.First());

        if (requestItemsById.Count != templateItems.Count || templateItems.Any(x => !requestItemsById.ContainsKey(x.Id)))
            return BadRequest(new { message = "Os itens enviados nao correspondem ao template STP ativo." });

        var itemXSemObservacao = templateItems
            .Select(x => requestItemsById[x.Id])
            .FirstOrDefault(x => x.Resultado == StpAreaChecklistResultado.X && string.IsNullOrWhiteSpace(x.Observacao));

        if (itemXSemObservacao is not null)
            return BadRequest(new { message = "Itens marcados com X exigem observacao obrigatoria." });

        var now = DateTime.UtcNow;
        var checklist = new StpAreaChecklist
        {
            SetorId = setorId.Value,
            SetorInspecionadoId = areaInspecao.SetorId,
            AreaInspecaoId = areaInspecao.Id,
            TemplateId = template.Id,
            InspetorSupervisorId = supervisorId.Value,
            ResponsavelPresenteNome = areaInspecao.ResponsavelSupervisor.Nome + " " + areaInspecao.ResponsavelSupervisor.Sobrenome,
            ResponsavelPresenteCargo = "Supervisor responsável",
            ComportamentosPreventivosObservados = NormalizeOptionalText(request.ComportamentosPreventivosObservados),
            AtosInsegurosObservados = NormalizeOptionalText(request.AtosInsegurosObservados),
            CondicoesInsegurasConstatadas = NormalizeOptionalText(request.CondicoesInsegurasConstatadas),
            AssinaturaInspetorBase64 = request.AssinaturaInspetorBase64.Trim(),
            AssinaturaResponsavelPresenteBase64 = request.AssinaturaResponsavelPresenteBase64.Trim(),
            AssinadoInspetorEm = now,
            AssinadoResponsavelPresenteEm = now,
            DataRealizacao = now,
            DataReferencia = BusinessDate.TodayKeyUtc(),
        };

        foreach (var templateItem in templateItems)
        {
            var requestItem = requestItemsById[templateItem.Id];
            checklist.Itens.Add(new StpAreaChecklistItem
            {
                TemplateItemId = templateItem.Id,
                Ordem = templateItem.Ordem,
                Descricao = templateItem.Descricao,
                Instrucao = templateItem.Instrucao,
                Resultado = requestItem.Resultado,
                Observacao = NormalizeOptionalText(requestItem.Observacao),
            });
        }

        _db.StpAreaChecklists.Add(checklist);
        await _db.SaveChangesAsync();

        var created = await _db.StpAreaChecklists
            .AsNoTracking()
            .Include(x => x.Template)
            .Include(x => x.InspetorSupervisor)
            .Include(x => x.AreaInspecao)
                .ThenInclude(x => x!.ResponsavelSupervisor)
            .Include(x => x.SetorInspecionado)
            .Include(x => x.Itens)
            .FirstAsync(x => x.Id == checklist.Id);

        return Created($"/api/stp/checklists/{created.Id}", ToChecklistDetailDto(created));
    }

    private static StpAreaChecklistTemplateDetailDto ToTemplateDetailDto(StpAreaChecklistTemplate template)
    {
        return new StpAreaChecklistTemplateDetailDto(
            template.Id,
            template.SetorId,
            template.Codigo,
            template.Nome,
            template.Ativo,
            template.Itens
                .Where(x => x.Ativo)
                .OrderBy(x => x.Ordem)
                .Select(x => new StpAreaChecklistTemplateItemDto(
                    x.Id,
                    x.Ordem,
                    x.Descricao,
                    x.Instrucao,
                    x.Ativo
                ))
                .ToList()
        );
    }

    private static StpAreaChecklistDetailDto ToChecklistDetailDto(StpAreaChecklist checklist)
    {
        return new StpAreaChecklistDetailDto(
            checklist.Id,
            checklist.SetorId,
            checklist.AreaInspecaoId,
            checklist.AreaInspecao != null ? checklist.AreaInspecao.Nome : checklist.SetorInspecionado.Nome,
            checklist.TemplateId,
            checklist.Template.Codigo,
            checklist.Template.Nome,
            checklist.DataRealizacao,
            checklist.DataReferencia,
            checklist.InspetorSupervisorId,
            checklist.InspetorSupervisor.Nome + " " + checklist.InspetorSupervisor.Sobrenome,
            checklist.AreaInspecao?.ResponsavelSupervisorId,
            checklist.AreaInspecao != null
                ? checklist.AreaInspecao.ResponsavelSupervisor.Nome + " " + checklist.AreaInspecao.ResponsavelSupervisor.Sobrenome
                : checklist.ResponsavelPresenteNome,
            checklist.ComportamentosPreventivosObservados,
            checklist.AtosInsegurosObservados,
            checklist.CondicoesInsegurasConstatadas,
            checklist.AssinaturaInspetorBase64,
            checklist.AssinaturaResponsavelPresenteBase64,
            checklist.Itens
                .OrderBy(x => x.Ordem)
                .Select(x => new StpAreaChecklistItemDto(
                    x.Id,
                    x.TemplateItemId,
                    x.Ordem,
                    x.Descricao,
                    x.Instrucao,
                    x.Resultado,
                    x.Observacao
                ))
                .ToList()
        );
    }

    private static string? NormalizeOptionalText(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static bool IsValidSignaturePayload(string? signatureBase64)
    {
        var normalized = signatureBase64?.Trim();

        if (string.IsNullOrWhiteSpace(normalized))
            return false;

        if (!normalized.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            return false;

        return normalized.Length <= 8_000_000;
    }
}
