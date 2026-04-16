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
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor/categorias-equipamento")]
public class CategoriasEquipamentoController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriasEquipamentoController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoriaEquipamentoDto>>> Listar([FromQuery] bool? ativas = null)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var q = _db.CategoriasEquipamento
            .AsNoTracking()
            .Where(x => x.SetorId == setorId.Value);

        if (ativas is not null)
            q = q.Where(x => x.Ativa == ativas.Value);

        var lista = await q
            .OrderBy(x => x.Nome)
            .Select(x => new CategoriaEquipamentoDto(x.Id, x.SetorId, x.Nome, x.Ativa, x.ModeloFechamentoMensal))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPost]
    public async Task<ActionResult<CategoriaEquipamentoDto>> Criar([FromBody] CriarCategoriaEquipamentoRequest req)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var nome = (req.Nome ?? "").Trim();
        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome é obrigatório." });

        var entity = new CategoriaEquipamento
        {
            SetorId = setorId.Value,
            Nome = nome,
            ModeloFechamentoMensal = req.ModeloFechamentoMensal,
            Ativa = req.Ativa
        };

        _db.CategoriasEquipamento.Add(entity);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (DatabaseErrorDetector.IsDuplicateKey(ex))
        {
            return Conflict(new { message = $"Já existe categoria '{nome}'." });
        }

        return Created("", new CategoriaEquipamentoDto(entity.Id, entity.SetorId, entity.Nome, entity.Ativa, entity.ModeloFechamentoMensal));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoriaEquipamentoDto>> Atualizar(Guid id, [FromBody] AtualizarCategoriaEquipamentoRequest req)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var entity = await _db.CategoriasEquipamento.FirstOrDefaultAsync(x => x.Id == id && x.SetorId == setorId.Value);
        if (entity is null)
            return NotFound(new { message = "Categoria não encontrada." });

        var nome = (req.Nome ?? "").Trim();
        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome é obrigatório." });

        entity.Nome = nome;
        entity.ModeloFechamentoMensal = req.ModeloFechamentoMensal;
        entity.Ativa = req.Ativa;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (DatabaseErrorDetector.IsDuplicateKey(ex))
        {
            return Conflict(new { message = $"Já existe categoria '{nome}'." });
        }

        return Ok(new CategoriaEquipamentoDto(entity.Id, entity.SetorId, entity.Nome, entity.Ativa, entity.ModeloFechamentoMensal));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Excluir(Guid id)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var entity = await _db.CategoriasEquipamento.FirstOrDefaultAsync(x => x.Id == id && x.SetorId == setorId.Value);
        if (entity is null)
            return NotFound(new { message = "Categoria não encontrada." });

        var temEquipamentos = await _db.Equipamentos.AnyAsync(e => e.CategoriaId == id && e.SetorId == setorId.Value);
        if (temEquipamentos)
            return BadRequest(new { message = "Não é possível excluir categoria com equipamentos vinculados." });

        _db.CategoriasEquipamento.Remove(entity);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
