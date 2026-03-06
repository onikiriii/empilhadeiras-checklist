using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/equipamentos")]
public class EquipamentosController : ControllerBase
{
    private readonly AppDbContext _db;

    public EquipamentosController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<EquipamentoDto>>> Listar()
    {
        var lista = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .OrderBy(e => e.Codigo)
            .Select(e => new EquipamentoDto(
                e.Id,
                e.Codigo,
                e.Descricao,
                e.Ativa,
                e.CategoriaId,
                e.Categoria.Nome,
                e.QrId))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("{codigo}")]
    public async Task<ActionResult<EquipamentoDto>> ObterPorCodigo(string codigo)
    {
        codigo = (codigo ?? "").Trim().ToUpperInvariant();

        var eq = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .Where(e => e.Codigo == codigo && e.Ativa)
            .Select(e => new EquipamentoDto(
                e.Id,
                e.Codigo,
                e.Descricao,
                e.Ativa,
                e.CategoriaId,
                e.Categoria.Nome,
                e.QrId))
            .FirstOrDefaultAsync();

        return eq is null ? NotFound(new { message = $"Equipamento com código '{codigo}' não encontrado." }) : Ok(eq);
    }

    [HttpGet("por-qr/{qrId:guid}")]
    public async Task<ActionResult<EquipamentoDto>> ObterPorQrId(Guid qrId)
    {
        var eq = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .Where(e => e.QrId == qrId && e.Ativa)
            .Select(e => new EquipamentoDto(
                e.Id,
                e.Codigo,
                e.Descricao,
                e.Ativa,
                e.CategoriaId,
                e.Categoria.Nome,
                e.QrId))
            .FirstOrDefaultAsync();

        return eq is null ? NotFound(new { message = "Equipamento não encontrado ou inativo." }) : Ok(eq);
    }

    [HttpPost]
    public async Task<ActionResult<EquipamentoDto>> Criar([FromBody] CriarEquipamentoRequest input)
    {
        var codigo = (input.Codigo ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(codigo))
            return BadRequest(new { message = "Codigo é obrigatório." });

        var categoriaOk = await _db.CategoriasEquipamento.AnyAsync(c => c.Id == input.CategoriaId && c.Ativa);
        if (!categoriaOk)
            return BadRequest(new { message = "Categoria inválida ou inativa." });

        var novo = new Equipamento
        {
            Codigo = codigo,
            Descricao = (input.Descricao ?? "").Trim(),
            CategoriaId = input.CategoriaId,
            Ativa = input.Ativa
        };

        _db.Equipamentos.Add(novo);

        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            return Conflict(new { message = $"Já existe equipamento com código '{codigo}'." });
        }

        var dto = new EquipamentoDto(
            novo.Id,
            novo.Codigo,
            novo.Descricao,
            novo.Ativa,
            novo.CategoriaId,
            await _db.CategoriasEquipamento.Where(c => c.Id == novo.CategoriaId).Select(c => c.Nome).FirstAsync(),
            novo.QrId);

        return CreatedAtAction(nameof(ObterPorCodigo), new { codigo = dto.Codigo }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EquipamentoDto>> Atualizar(Guid id, [FromBody] AtualizarEquipamentoRequest input)
    {
        var eq = await _db.Equipamentos.Include(e => e.Categoria).FirstOrDefaultAsync(e => e.Id == id);
        if (eq is null) return NotFound(new { message = "Equipamento não encontrado." });

        var categoriaOk = await _db.CategoriasEquipamento.AnyAsync(c => c.Id == input.CategoriaId && c.Ativa);
        if (!categoriaOk)
            return BadRequest(new { message = "Categoria inválida ou inativa." });

        eq.Descricao = (input.Descricao ?? "").Trim();
        eq.CategoriaId = input.CategoriaId;
        eq.Ativa = input.Ativa;

        await _db.SaveChangesAsync();

        return Ok(new EquipamentoDto(
            eq.Id,
            eq.Codigo,
            eq.Descricao,
            eq.Ativa,
            eq.CategoriaId,
            eq.Categoria.Nome,
            eq.QrId));
    }
}