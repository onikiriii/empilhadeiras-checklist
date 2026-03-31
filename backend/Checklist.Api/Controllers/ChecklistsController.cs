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

    [AllowAnonymous]
    [HttpPost]
    public async Task<ActionResult<ChecklistDto>> Enviar([FromBody] EnviarChecklistRequest req)
    {
        if (req.EquipamentoId == Guid.Empty || req.OperadorId == Guid.Empty)
            return BadRequest(new { message = "EquipamentoId e OperadorId sao obrigatorios." });

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
            .FirstOrDefaultAsync(o => o.Id == req.OperadorId && o.Ativo);
        if (operador is null)
            return BadRequest(new { message = "Operador invalido ou inativo." });

        if (operador.SetorId != equipamento.SetorId)
            return BadRequest(new { message = "Operador e equipamento precisam pertencer ao mesmo setor." });

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
            OperadorId = req.OperadorId,
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
                Observacao = string.IsNullOrWhiteSpace(itemReq.Observacao) ? null : itemReq.Observacao.Trim()
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
            checklist.Itens.Select(i => new ChecklistItemDto(
                i.Id,
                i.TemplateId,
                i.Ordem,
                i.Descricao,
                i.Instrucao,
                i.Status,
                i.Observacao
            )).ToList()
        );
    }
}
