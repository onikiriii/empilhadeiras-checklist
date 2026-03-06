using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/checklists")]
public class ChecklistsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ChecklistsController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult<ChecklistDto>> Enviar([FromBody] EnviarChecklistRequest req)
    {
        // Validações básicas
        if (req.EquipamentoId == Guid.Empty || req.OperadorId == Guid.Empty)
            return BadRequest(new { message = "EquipamentoId e OperadorId são obrigatórios." });

        if (req.Itens.Count == 0)
            return BadRequest(new { message = "Checklist deve ter pelo menos um item." });

        // Verifica se equipamento e operador existem e estão ativos
        var equipamento = await _db.Equipamentos
            .Include(e => e.Categoria)
            .FirstOrDefaultAsync(e => e.Id == req.EquipamentoId && e.Ativa);
        if (equipamento is null)
            return BadRequest(new { message = "Equipamento inválido ou inativo." });

        var operador = await _db.Operadores.FirstOrDefaultAsync(o => o.Id == req.OperadorId && o.Ativo);
        if (operador is null)
            return BadRequest(new { message = "Operador inválido ou inativo." });

        // Busca os templates ativos da categoria
        var templates = await _db.ChecklistItensTemplate
            .Where(t => t.CategoriaId == equipamento.CategoriaId && t.Ativo)
            .OrderBy(t => t.Ordem)
            .ToListAsync();

        if (templates.Count == 0)
            return BadRequest(new { message = "Não há itens de checklist configurados para esta categoria." });

        // Valida se todos os itens enviados correspondem aos templates
        var templateIds = templates.Select(t => t.Id).ToHashSet();
        if (req.Itens.Any(i => !templateIds.Contains(i.TemplateId)))
            return BadRequest(new { message = "Um ou mais itens não correspondem aos templates da categoria." });

        // Cria o checklist
        var checklist = new Models.Checklist
        {
            EquipamentoId = req.EquipamentoId,
            OperadorId = req.OperadorId,
            ObservacoesGerais = string.IsNullOrWhiteSpace(req.ObservacoesGerais) ? null : req.ObservacoesGerais.Trim(),
            Status = ChecklistStatus.Pendente
        };

        // Adiciona os itens
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

        // Determina se aprovado (todos OK ou NA)
        checklist.Aprovado = checklist.Itens.All(i => i.Status == ItemStatus.OK || i.Status == ItemStatus.NA);

        // Se não aprovado, vai para manutenção
        if (!checklist.Aprovado)
            checklist.Status = ChecklistStatus.Reprovado;

        _db.Checklists.Add(checklist);
        await _db.SaveChangesAsync();

        // Retorna o DTO completo
        var dto = new ChecklistDto(
            checklist.Id,
            checklist.EquipamentoId,
            equipamento.Codigo,
            checklist.OperadorId,
            operador.Nome,
            checklist.DataRealizacao,
            checklist.Aprovado,
            checklist.ObservacoesGerais,
            checklist.Status,
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

        return Created("", dto);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ChecklistDto>> Obter(Guid id)
    {
        var checklist = await _db.Checklists
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (checklist is null) return NotFound(new { message = "Checklist não encontrado." });

        var dto = new ChecklistDto(
            checklist.Id,
            checklist.EquipamentoId,
            checklist.Equipamento.Codigo,
            checklist.OperadorId,
            checklist.Operador.Nome,
            checklist.DataRealizacao,
            checklist.Aprovado,
            checklist.ObservacoesGerais,
            checklist.Status,
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

        return Ok(dto);
    }
}