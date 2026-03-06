using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/supervisor/checklist-itens-template")]
public class ChecklistItensTemplateController : ControllerBase
{
    private readonly AppDbContext _db;

    public ChecklistItensTemplateController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<ChecklistItemTemplateDto>>> ListarPorCategoria(
        [FromQuery] Guid categoriaId,
        [FromQuery] bool? ativos = true)
    {
        if (categoriaId == Guid.Empty)
            return BadRequest(new { message = "categoriaId é obrigatório." });

        var q = _db.ChecklistItensTemplate
            .AsNoTracking()
            .Where(x => x.CategoriaId == categoriaId);

        if (ativos is not null)
            q = q.Where(x => x.Ativo == ativos.Value);

        var lista = await q
            .OrderBy(x => x.Ordem)
            .Select(x => new ChecklistItemTemplateDto(x.Id, x.CategoriaId, x.Ordem, x.Descricao, x.Instrucao, x.Ativo))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPost]
    public async Task<ActionResult<ChecklistItemTemplateDto>> Criar([FromBody] CriarChecklistItemTemplateRequest req)
    {
        if (req.CategoriaId == Guid.Empty)
            return BadRequest(new { message = "CategoriaId é obrigatório." });

        var desc = (req.Descricao ?? "").Trim();
        if (string.IsNullOrWhiteSpace(desc))
            return BadRequest(new { message = "Descricao é obrigatória." });

        var categoriaOk = await _db.CategoriasEquipamento.AnyAsync(c => c.Id == req.CategoriaId && c.Ativa);
        if (!categoriaOk)
            return BadRequest(new { message = "Categoria inválida ou inativa." });

        var item = new ChecklistItemTemplate
        {
            CategoriaId = req.CategoriaId,
            Ordem = req.Ordem,
            Descricao = desc,
            Instrucao = string.IsNullOrWhiteSpace(req.Instrucao) ? null : req.Instrucao.Trim(),
            Ativo = req.Ativo
        };

        _db.ChecklistItensTemplate.Add(item);
        await _db.SaveChangesAsync();

        return Created("", new ChecklistItemTemplateDto(item.Id, item.CategoriaId, item.Ordem, item.Descricao, item.Instrucao, item.Ativo));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ChecklistItemTemplateDto>> Atualizar(Guid id, [FromBody] AtualizarChecklistItemTemplateRequest req)
    {
        var item = await _db.ChecklistItensTemplate.FirstOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound(new { message = "Item não encontrado." });

        var desc = (req.Descricao ?? "").Trim();
        if (string.IsNullOrWhiteSpace(desc))
            return BadRequest(new { message = "Descricao é obrigatória." });

        item.Ordem = req.Ordem;
        item.Descricao = desc;
        item.Instrucao = string.IsNullOrWhiteSpace(req.Instrucao) ? null : req.Instrucao.Trim();
        item.Ativo = req.Ativo;

        await _db.SaveChangesAsync();

        return Ok(new ChecklistItemTemplateDto(item.Id, item.CategoriaId, item.Ordem, item.Descricao, item.Instrucao, item.Ativo));
    }

    [HttpDelete("{id:guid}")]
public async Task<ActionResult> Excluir(Guid id)
{
    var item = await _db.ChecklistItensTemplate.FirstOrDefaultAsync(x => x.Id == id);
    if (item is null) return NotFound(new { message = "Item não encontrado." });

    _db.ChecklistItensTemplate.Remove(item);
    await _db.SaveChangesAsync();

    return NoContent();
}
}