using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/operadores")]
public class OperadoresController : ControllerBase
{
    private readonly AppDbContext _db;

    public OperadoresController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<OperadorDto>>> Listar([FromQuery] bool? ativos = true)
    {
        var query = _db.Operadores.AsNoTracking();

        if (ativos is not null)
            query = query.Where(o => o.Ativo == ativos.Value);

        var lista = await query
            .OrderBy(o => o.Matricula)
            .Select(o => new OperadorDto(o.Id, o.Matricula, o.Nome, o.Ativo))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("{matricula}")]
    public async Task<ActionResult<OperadorDto>> ObterPorMatricula(string matricula)
    {
        matricula = (matricula ?? "").Trim();

        var op = await _db.Operadores
            .AsNoTracking()
            .Where(o => o.Matricula == matricula)
            .Select(o => new OperadorDto(o.Id, o.Matricula, o.Nome, o.Ativo))
            .FirstOrDefaultAsync();

        return op is null ? NotFound(new { message = "Operador não encontrado." }) : Ok(op);
    }

    [HttpGet("busca")]
public async Task<ActionResult<List<object>>> Buscar([FromQuery] string query, [FromQuery] int take = 10)
{
    if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
        return Ok(new List<object>());

    var operadores = await _db.Operadores
        .AsNoTracking()
        .Where(o => o.Ativo && 
               (o.Nome.ToLower().Contains(query.ToLower()) || 
                o.Matricula.Contains(query)))
        .OrderBy(o => o.Nome)
        .Take(take)
        .Select(o => new { 
            o.Id, 
            o.Nome, 
            o.Matricula 
        })
        .ToListAsync();

    return Ok(operadores);
}

    [HttpPost]
    public async Task<ActionResult<OperadorDto>> Criar([FromBody] CriarOperadorRequest req)
    {
        var matricula = (req.Matricula ?? "").Trim();
        var nome = (req.Nome ?? "").Trim();

        if (string.IsNullOrWhiteSpace(matricula))
            return BadRequest(new { message = "Matrícula é obrigatória." });

        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome é obrigatório." });

        var existe = await _db.Operadores.AnyAsync(o => o.Matricula == matricula);
        if (existe)
            return Conflict(new { message = $"Já existe operador com matrícula '{matricula}'." });

        var op = new Operador
        {
            Matricula = matricula,
            Nome = nome,
            Ativo = true
        };

        _db.Operadores.Add(op);
        await _db.SaveChangesAsync();

        var dto = new OperadorDto(op.Id, op.Matricula, op.Nome, op.Ativo);
        return CreatedAtAction(nameof(ObterPorMatricula), new { matricula = dto.Matricula }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<OperadorDto>> Atualizar(Guid id, [FromBody] AtualizarOperadorRequest req)
    {
        var op = await _db.Operadores.FirstOrDefaultAsync(o => o.Id == id);
        if (op is null) return NotFound(new { message = "Operador não encontrado." });

        op.Nome = (req.Nome ?? "").Trim();
        op.Ativo = req.Ativo;

        await _db.SaveChangesAsync();

        return Ok(new OperadorDto(op.Id, op.Matricula, op.Nome, op.Ativo));
    }
}