using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            return BadRequest(new { message = "EquipamentoId e OperadorId são obrigatórios." });

        if (req.Itens.Count == 0)
            return BadRequest(new { message = "Checklist deve ter pelo menos um item." });

        if (string.IsNullOrWhiteSpace(req.AssinaturaOperadorBase64))
            return BadRequest(new { message = "A assinatura do operador é obrigatória." });

        var equipamento = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .FirstOrDefaultAsync(e => e.Id == req.EquipamentoId && e.Ativa);
        if (equipamento is null)
            return BadRequest(new { message = "Equipamento inválido ou inativo." });

        var operador = await _db.Operadores
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == req.OperadorId && o.Ativo);
        if (operador is null)
            return BadRequest(new { message = "Operador inválido ou inativo." });

        if (operador.SetorId != equipamento.SetorId)
            return BadRequest(new { message = "Operador e equipamento precisam pertencer ao mesmo setor." });

        if (equipamento.Categoria.SetorId != equipamento.SetorId)
            return BadRequest(new { message = "O equipamento está vinculado a uma categoria de outro setor." });

        var templates = await _db.ChecklistItensTemplate
            .AsNoTracking()
            .Where(t => t.CategoriaId == equipamento.CategoriaId && t.SetorId == equipamento.SetorId && t.Ativo)
            .OrderBy(t => t.Ordem)
            .ToListAsync();

        if (templates.Count == 0)
            return BadRequest(new { message = "Não há itens de checklist configurados para esta categoria." });

        var templateIds = templates.Select(t => t.Id).ToHashSet();
        if (req.Itens.Any(i => !templateIds.Contains(i.TemplateId)))
            return BadRequest(new { message = "Um ou mais itens não correspondem aos templates da categoria." });

        var checklist = new Checklist.Api.Models.Checklist
        {
            SetorId = equipamento.SetorId,
            EquipamentoId = req.EquipamentoId,
            OperadorId = req.OperadorId,
            ObservacoesGerais = string.IsNullOrWhiteSpace(req.ObservacoesGerais) ? null : req.ObservacoesGerais.Trim(),
            AssinaturaOperadorBase64 = req.AssinaturaOperadorBase64.Trim(),
            AssinadoEm = DateTime.UtcNow,
            Status = ChecklistStatus.Pendente
        };

        foreach (var itemReq in req.Itens)
        {
            var template = templates.First(t => t.Id == itemReq.TemplateId);
            var item = new ChecklistItem
            {
                TemplateId = itemReq.TemplateId,
                Ordem = template.Ordem,
                Descricao = template.Descricao,
                Instrucao = template.Instrucao,
                Status = itemReq.Status,
                Observacao = string.IsNullOrWhiteSpace(itemReq.Observacao) ? null : itemReq.Observacao.Trim()
            };
            checklist.Itens.Add(item);
        }

        checklist.Aprovado = checklist.Itens.All(i => i.Status == ItemStatus.OK || i.Status == ItemStatus.NA);

        if (!checklist.Aprovado)
            checklist.Status = ChecklistStatus.Reprovado;

        _db.Checklists.Add(checklist);
        await _db.SaveChangesAsync();

        var dto = CreateChecklistDto(checklist, equipamento.Codigo, operador.Nome);
        return Created("", dto);
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
            return NotFound(new { message = "Checklist não encontrado." });

        return Ok(CreateChecklistDto(checklist, checklist.Equipamento.Codigo, checklist.Operador.Nome));
    }

    private static ChecklistDto CreateChecklistDto(Checklist.Api.Models.Checklist checklist, string equipamentoCodigo, string operadorNome)
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
