using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "MasterReady")]
[Route("api/master/setores")]
public class SetoresController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ChecklistStandardCatalogService _checklistStandardCatalogService;
    private readonly StpAreaTemplateCatalogService _stpAreaTemplateCatalogService;

    public SetoresController(
        AppDbContext db,
        ChecklistStandardCatalogService checklistStandardCatalogService,
        StpAreaTemplateCatalogService stpAreaTemplateCatalogService)
    {
        _db = db;
        _checklistStandardCatalogService = checklistStandardCatalogService;
        _stpAreaTemplateCatalogService = stpAreaTemplateCatalogService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SetorDto>>> Listar()
    {
        var setores = await _db.Setores
            .AsNoTracking()
            .OrderBy(x => x.Nome)
            .Select(x => new SetorDto(
                x.Id,
                x.Nome,
                x.Descricao,
                x.Ativo,
                x.CriadoEm,
                _db.UsuariosSupervisores.Count(u => !u.IsMaster && u.SetorId == x.Id),
                _db.Equipamentos.Count(e => e.SetorId == x.Id),
                _db.Operadores.Count(o => o.SetorId == x.Id)
            ))
            .ToListAsync();

        return Ok(setores);
    }

    [HttpPost]
    public async Task<ActionResult<SetorDto>> Criar([FromBody] CriarSetorRequest request)
    {
        var nome = (request.Nome ?? string.Empty).Trim();
        var descricao = string.IsNullOrWhiteSpace(request.Descricao) ? null : request.Descricao.Trim();

        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome do setor e obrigatorio." });

        var nomeNormalizado = nome.ToLowerInvariant();
        var nomeExiste = await _db.Setores.AnyAsync(x => x.Nome.ToLower() == nomeNormalizado);
        if (nomeExiste)
            return Conflict(new { message = "Ja existe um setor com este nome." });

        var setor = new Setor
        {
            Nome = nome,
            Descricao = descricao,
            Ativo = request.Ativo
        };

        _db.Setores.Add(setor);
        await _db.SaveChangesAsync();
        await _checklistStandardCatalogService.EnsureDefaultsForSetorAsync(setor.Id);
        await _stpAreaTemplateCatalogService.EnsureDefaultsForSetorAsync(setor.Id);

        return Created("", ToDto(setor, 0, 0, 0));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SetorDto>> Atualizar(Guid id, [FromBody] AtualizarSetorRequest request)
    {
        var setor = await _db.Setores.FirstOrDefaultAsync(x => x.Id == id);
        if (setor is null)
            return NotFound(new { message = "Setor nao encontrado." });

        var nome = (request.Nome ?? string.Empty).Trim();
        var descricao = string.IsNullOrWhiteSpace(request.Descricao) ? null : request.Descricao.Trim();

        if (string.IsNullOrWhiteSpace(nome))
            return BadRequest(new { message = "Nome do setor e obrigatorio." });

        var nomeNormalizado = nome.ToLowerInvariant();
        var nomeExiste = await _db.Setores.AnyAsync(x => x.Id != id && x.Nome.ToLower() == nomeNormalizado);
        if (nomeExiste)
            return Conflict(new { message = "Ja existe outro setor com este nome." });

        setor.Nome = nome;
        setor.Descricao = descricao;
        setor.Ativo = request.Ativo;

        await _db.SaveChangesAsync();

        var supervisoresCount = await _db.UsuariosSupervisores.CountAsync(x => !x.IsMaster && x.SetorId == setor.Id);
        var equipamentosCount = await _db.Equipamentos.CountAsync(x => x.SetorId == setor.Id);
        var operadoresCount = await _db.Operadores.CountAsync(x => x.SetorId == setor.Id);

        return Ok(ToDto(setor, supervisoresCount, equipamentosCount, operadoresCount));
    }

    private static SetorDto ToDto(Setor setor, int supervisoresCount, int equipamentosCount, int operadoresCount)
    {
        return new SetorDto(
            setor.Id,
            setor.Nome,
            setor.Descricao,
            setor.Ativo,
            setor.CriadoEm,
            supervisoresCount,
            equipamentosCount,
            operadoresCount
        );
    }
}
