using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/supervisor/categorias-equipamento")]
public class CategoriasEquipamentoController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriasEquipamentoController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoriaEquipamentoDto>>> Listar([FromQuery] bool? ativas = true)
    {
        var q = _db.CategoriasEquipamento.AsNoTracking();

        if (ativas is not null)
            q = q.Where(x => x.Ativa == ativas.Value);

        var lista = await q
            .OrderBy(x => x.Nome)
            .Select(x => new CategoriaEquipamentoDto(x.Id, x.Nome, x.Ativa))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPost]
    public async Task<ActionResult<CategoriaEquipamentoDto>> Criar([FromBody] CriarCategoriaEquipamentoRequest req)
    {
        var nome = (req.Nome ?? "").Trim();
        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome é obrigatório." });

        var entity = new CategoriaEquipamento { Nome = nome, Ativa = req.Ativa };

        _db.CategoriasEquipamento.Add(entity);

        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            return Conflict(new { message = $"Já existe categoria '{nome}'." });
        }

        return Created("", new CategoriaEquipamentoDto(entity.Id, entity.Nome, entity.Ativa));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoriaEquipamentoDto>> Atualizar(Guid id, [FromBody] AtualizarCategoriaEquipamentoRequest req)
    {
        var entity = await _db.CategoriasEquipamento.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return NotFound(new { message = "Categoria não encontrada." });

        var nome = (req.Nome ?? "").Trim();
        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome é obrigatório." });

        entity.Nome = nome;
        entity.Ativa = req.Ativa;

        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            return Conflict(new { message = $"Já existe categoria '{nome}'." });
        }

        return Ok(new CategoriaEquipamentoDto(entity.Id, entity.Nome, entity.Ativa));
    }

    [HttpDelete("{id:guid}")]
public async Task<ActionResult> Excluir(Guid id)
{
    var entity = await _db.CategoriasEquipamento.FirstOrDefaultAsync(x => x.Id == id);
    if (entity is null) return NotFound(new { message = "Categoria não encontrada." });

    // Verificar se há equipamentos vinculados
    var temEquipamentos = await _db.Equipamentos.AnyAsync(e => e.CategoriaId == id);
    if (temEquipamentos)
        return BadRequest(new { message = "Não é possível excluir categoria com equipamentos vinculados." });

    _db.CategoriasEquipamento.Remove(entity);
    await _db.SaveChangesAsync();

    return NoContent();
}
}