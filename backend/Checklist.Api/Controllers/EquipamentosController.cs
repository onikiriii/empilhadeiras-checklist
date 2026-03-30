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
[Route("api/equipamentos")]
public class EquipamentosController : ControllerBase
{
    private readonly AppDbContext _db;

    public EquipamentosController(AppDbContext db) => _db = db;

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpGet]
    public async Task<ActionResult<List<EquipamentoDto>>> Listar()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var lista = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .Where(e => e.SetorId == setorId.Value)
            .OrderBy(e => e.Codigo)
            .Select(e => new EquipamentoDto(
                e.Id,
                e.SetorId,
                e.Codigo,
                e.Descricao,
                e.Ativa,
                e.CategoriaId,
                e.Categoria.Nome,
                e.QrId))
            .ToListAsync();

        return Ok(lista);
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpGet("{codigo}")]
    public async Task<ActionResult<EquipamentoDto>> ObterPorCodigo(string codigo)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        codigo = (codigo ?? "").Trim().ToUpperInvariant();

        var eq = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .Where(e => e.Codigo == codigo && e.Ativa && e.SetorId == setorId.Value)
            .Select(e => new EquipamentoDto(
                e.Id,
                e.SetorId,
                e.Codigo,
                e.Descricao,
                e.Ativa,
                e.CategoriaId,
                e.Categoria.Nome,
                e.QrId))
            .FirstOrDefaultAsync();

        return eq is null ? NotFound(new { message = $"Equipamento com código '{codigo}' não encontrado." }) : Ok(eq);
    }

    [AllowAnonymous]
    [HttpGet("por-qr/{qrId:guid}")]
    public async Task<ActionResult<EquipamentoDto>> ObterPorQrId(Guid qrId)
    {
        var eq = await _db.Equipamentos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .Where(e => e.QrId == qrId && e.Ativa)
            .Select(e => new EquipamentoDto(
                e.Id,
                e.SetorId,
                e.Codigo,
                e.Descricao,
                e.Ativa,
                e.CategoriaId,
                e.Categoria.Nome,
                e.QrId))
            .FirstOrDefaultAsync();

        return eq is null ? NotFound(new { message = "Equipamento não encontrado ou inativo." }) : Ok(eq);
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpPost]
    public async Task<ActionResult<EquipamentoDto>> Criar([FromBody] CriarEquipamentoRequest input)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var codigo = (input.Codigo ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(codigo))
            return BadRequest(new { message = "Codigo é obrigatório." });

        var categoria = await _db.CategoriasEquipamento
            .AsNoTracking()
            .Where(c => c.Id == input.CategoriaId && c.Ativa && c.SetorId == setorId.Value)
            .Select(c => new { c.Id, c.Nome, c.SetorId })
            .FirstOrDefaultAsync();

        if (categoria is null)
            return BadRequest(new { message = "Categoria inválida, inativa ou fora do setor." });

        var existeCodigo = await _db.Equipamentos.AnyAsync(e => e.Codigo == codigo && e.SetorId == setorId.Value);
        if (existeCodigo)
            return Conflict(new { message = $"Já existe equipamento com código '{codigo}' neste setor." });

        var novo = new Equipamento
        {
            SetorId = setorId.Value,
            Codigo = codigo,
            Descricao = (input.Descricao ?? "").Trim(),
            CategoriaId = input.CategoriaId,
            Ativa = input.Ativa
        };

        _db.Equipamentos.Add(novo);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (DatabaseErrorDetector.IsDuplicateKey(ex))
        {
            return Conflict(new { message = $"Já existe equipamento com código '{codigo}'." });
        }

        var dto = new EquipamentoDto(
            novo.Id,
            novo.SetorId,
            novo.Codigo,
            novo.Descricao,
            novo.Ativa,
            novo.CategoriaId,
            categoria.Nome,
            novo.QrId);

        return CreatedAtAction(nameof(ObterPorCodigo), new { codigo = dto.Codigo }, dto);
    }

    [Authorize(Policy = "SectorSupervisorReady")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EquipamentoDto>> Atualizar(Guid id, [FromBody] AtualizarEquipamentoRequest input)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var eq = await _db.Equipamentos.Include(e => e.Categoria).FirstOrDefaultAsync(e => e.Id == id && e.SetorId == setorId.Value);
        if (eq is null)
            return NotFound(new { message = "Equipamento não encontrado." });

        var categoria = await _db.CategoriasEquipamento
            .AsNoTracking()
            .Where(c => c.Id == input.CategoriaId && c.Ativa && c.SetorId == setorId.Value)
            .Select(c => new { c.Id, c.Nome, c.SetorId })
            .FirstOrDefaultAsync();

        if (categoria is null)
            return BadRequest(new { message = "Categoria inválida, inativa ou fora do setor." });

        eq.Descricao = (input.Descricao ?? "").Trim();
        eq.CategoriaId = input.CategoriaId;
        eq.Ativa = input.Ativa;

        await _db.SaveChangesAsync();

        return Ok(new EquipamentoDto(
            eq.Id,
            eq.SetorId,
            eq.Codigo,
            eq.Descricao,
            eq.Ativa,
            eq.CategoriaId,
            categoria.Nome,
            eq.QrId));
    }
}
