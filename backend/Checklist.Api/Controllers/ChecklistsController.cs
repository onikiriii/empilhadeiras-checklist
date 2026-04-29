using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChecklistModel = Checklist.Api.Models.Checklist;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/checklists")]
public class ChecklistsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ChecklistsController(AppDbContext db) => _db = db;

    [Authorize(Policy = "OperatorChecklistReady")]
    [HttpPost]
    public async Task<ActionResult<ChecklistDto>> Enviar([FromBody] EnviarChecklistRequest req)
    {
        var operadorId = CurrentOperadorClaims.GetOperadorId(User);
        var operadorSetorId = CurrentOperadorClaims.GetSetorId(User);

        if (operadorId is null || operadorSetorId is null)
            return Unauthorized(new { message = "Operador autenticado invalido." });

        if (req.EquipamentoId == Guid.Empty)
            return BadRequest(new { message = "EquipamentoId e obrigatorio." });

        if (req.Itens.Count == 0)
            return BadRequest(new { message = "Checklist deve ter pelo menos um item." });

        if (string.IsNullOrWhiteSpace(req.AssinaturaOperadorBase64))
            return BadRequest(new { message = "A assinatura do operador e obrigatoria." });

        var dataReferencia = BusinessDate.TodayKeyUtc();

        var equipamento = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .FirstOrDefaultAsync(e => e.Id == req.EquipamentoId && e.Ativa);
        if (equipamento is null)
            return BadRequest(new { message = "Equipamento invalido ou inativo." });

        var operador = await _db.Operadores
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == operadorId.Value && o.Ativo);
        if (operador is null)
            return BadRequest(new { message = "Operador invalido ou inativo." });

        if (req.OperadorId != Guid.Empty && req.OperadorId != operador.Id)
            return BadRequest(new { message = "O operador autenticado nao corresponde ao operador informado." });

        if (operador.SetorId != equipamento.SetorId)
            return BadRequest(new { message = "Operador e equipamento precisam pertencer ao mesmo setor." });

        if (operador.SetorId != operadorSetorId.Value)
            return BadRequest(new { message = "O setor autenticado do operador nao corresponde ao cadastro." });

        if (equipamento.Categoria.SetorId != equipamento.SetorId)
            return BadRequest(new { message = "O equipamento esta vinculado a uma categoria de outro setor." });

        var templates = await _db.ChecklistItensTemplate
            .AsNoTracking()
            .Where(t => t.CategoriaId == equipamento.CategoriaId && t.SetorId == equipamento.SetorId && t.Ativo)
            .OrderBy(t => t.Ordem)
            .ToListAsync();

        if (templates.Count == 0)
            return BadRequest(new { message = "Nao ha itens de checklist configurados para esta categoria." });

        var templateIds = templates.Select(t => t.Id).ToHashSet();
        if (req.Itens.Any(i => !templateIds.Contains(i.TemplateId)))
            return BadRequest(new { message = "Um ou mais itens nao correspondem aos templates da categoria." });

        var itemNokSemObservacao = req.Itens.FirstOrDefault(i =>
            i.Status == ItemStatus.NOK &&
            string.IsNullOrWhiteSpace(i.Observacao));

        if (itemNokSemObservacao is not null)
            return BadRequest(new { message = "Itens marcados como NOK exigem observacao obrigatoria." });

        var itemComImagemInvalida = req.Itens.FirstOrDefault(i =>
            !string.IsNullOrWhiteSpace(i.ImagemNokBase64) &&
            !IsValidChecklistImagePayload(i.ImagemNokBase64!, i.ImagemNokMimeType));

        if (itemComImagemInvalida is not null)
            return BadRequest(new { message = "A imagem anexada em um item NOK esta invalida ou excede o limite suportado." });

        var proximaDataReferencia = dataReferencia.AddDays(1);

        var checklistExistenteHoje = await _db.Checklists
            .AsNoTracking()
            .AnyAsync(c =>
                c.SetorId == equipamento.SetorId &&
                c.EquipamentoId == req.EquipamentoId &&
                c.DataReferencia >= dataReferencia &&
                c.DataReferencia < proximaDataReferencia);

        if (checklistExistenteHoje)
            return Conflict(new { message = "Este equipamento ja possui checklist registrado hoje." });

        var checklist = new ChecklistModel
        {
            SetorId = equipamento.SetorId,
            EquipamentoId = req.EquipamentoId,
            OperadorId = operador.Id,
            DataReferencia = dataReferencia,
            ObservacoesGerais = string.IsNullOrWhiteSpace(req.ObservacoesGerais) ? null : req.ObservacoesGerais.Trim(),
            AssinaturaOperadorBase64 = req.AssinaturaOperadorBase64.Trim(),
            AssinadoEm = DateTime.UtcNow,
            Status = ChecklistStatus.Pendente
        };

        foreach (var itemReq in req.Itens)
        {
            var template = templates.First(t => t.Id == itemReq.TemplateId);
            checklist.Itens.Add(new ChecklistItem
            {
                TemplateId = itemReq.TemplateId,
                Ordem = template.Ordem,
                Descricao = template.Descricao,
                Instrucao = template.Instrucao,
                Status = itemReq.Status,
                Observacao = string.IsNullOrWhiteSpace(itemReq.Observacao) ? null : itemReq.Observacao.Trim(),
                ImagemNokBase64 = itemReq.Status == ItemStatus.NOK ? NormalizeOptionalBase64(itemReq.ImagemNokBase64) : null,
                ImagemNokNomeArquivo = itemReq.Status == ItemStatus.NOK ? NormalizeOptionalText(itemReq.ImagemNokNomeArquivo) : null,
                ImagemNokMimeType = itemReq.Status == ItemStatus.NOK ? NormalizeOptionalText(itemReq.ImagemNokMimeType) : null
            });
        }

        checklist.Aprovado = checklist.Itens.All(i => i.Status == ItemStatus.OK || i.Status == ItemStatus.NA);
        if (!checklist.Aprovado)
            checklist.Status = ChecklistStatus.Reprovado;

        _db.Checklists.Add(checklist);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (DatabaseErrorDetector.IsDuplicateKey(ex))
        {
            return Conflict(new { message = "Este equipamento ja possui checklist registrado hoje." });
        }
        catch (DbUpdateException)
        {
            return StatusCode(500, new { message = "Nao foi possivel salvar o checklist. Verifique a configuracao do banco e tente novamente." });
        }

        return Created(string.Empty, CreateChecklistDto(checklist, equipamento.Codigo, operador.Nome));
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ChecklistDto>> Obter(Guid id)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var checklist = await _db.Checklists
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .FirstOrDefaultAsync(c => c.Id == id && c.SetorId == setorId.Value);

        if (checklist is null)
            return NotFound(new { message = "Checklist nao encontrado." });

        return Ok(CreateChecklistDto(checklist, checklist.Equipamento.Codigo, checklist.Operador.Nome));
    }

    private static ChecklistDto CreateChecklistDto(ChecklistModel checklist, string equipamentoCodigo, string operadorNome)
    {
        return new ChecklistDto(
            checklist.Id,
            checklist.SetorId,
            checklist.EquipamentoId,
            equipamentoCodigo,
            checklist.OperadorId,
            operadorNome,
            checklist.DataRealizacao,
            checklist.Aprovado,
            checklist.ObservacoesGerais,
            checklist.Status,
            checklist.AssinaturaOperadorBase64,
            checklist.Itens
                .OrderBy(i => i.Ordem)
                .Select(i => new ChecklistItemDto(
                i.Id,
                i.TemplateId,
                i.Ordem,
                i.Descricao,
                i.Instrucao,
                i.Status,
                i.Observacao,
                i.ImagemNokBase64,
                i.ImagemNokNomeArquivo,
                i.ImagemNokMimeType
            )).ToList()
        );
    }

    private static bool IsValidChecklistImagePayload(string imageBase64, string? mimeType)
    {
        var normalizedImage = NormalizeOptionalBase64(imageBase64);
        var normalizedMimeType = NormalizeOptionalText(mimeType);

        if (string.IsNullOrWhiteSpace(normalizedImage))
            return false;

        if (!normalizedImage.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            return false;

        if (normalizedMimeType is not null && !normalizedMimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return false;

        return normalizedImage.Length <= 8_000_000;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string? NormalizeOptionalBase64(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
