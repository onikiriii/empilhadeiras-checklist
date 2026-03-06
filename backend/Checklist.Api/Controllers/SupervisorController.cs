using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Route("api/supervisor")]
public class SupervisorController : ControllerBase
{
    private readonly AppDbContext _db;

    public SupervisorController(AppDbContext db) => _db = db;

    // Novo DTO inline (substitui EquipamentoStatusDto)
    public record EquipamentoStatusDto(string Codigo, string Descricao, bool TemChecklistHoje);

    [HttpGet("equipamentos-status")]
    public async Task<ActionResult<List<EquipamentoStatusDto>>> ObterStatusEquipamentos()
    {
        var hojeInicio = DateTime.Today;
        var hojeFim = hojeInicio.AddDays(1);

        var lista = await _db.Equipamentos
            .AsNoTracking()
            .Where(e => e.Ativa)
            .OrderBy(e => e.Codigo)
            .Select(e => new EquipamentoStatusDto(
                e.Codigo,
                e.Descricao,
                _db.Checklists.Any(c => c.EquipamentoId == e.Id && c.DataRealizacao >= hojeInicio && c.DataRealizacao < hojeFim)
            ))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("checklist/{codigo}/hoje")]
    public async Task<ActionResult<ChecklistDto>> ObterChecklistHoje(string codigo)
    {
        codigo = (codigo ?? "").Trim().ToUpperInvariant();

        var hojeInicio = DateTime.Today;
        var hojeFim = hojeInicio.AddDays(1);

        var checklist = await _db.Checklists
            .AsNoTracking()
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .Where(c => c.Equipamento.Codigo == codigo && c.DataRealizacao >= hojeInicio && c.DataRealizacao < hojeFim)
            .FirstOrDefaultAsync();

        if (checklist is null)
            return NotFound(new { message = "Nenhum checklist encontrado para hoje neste equipamento." });

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

    
    
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var hoje = DateTime.UtcNow.Date;

        // Buscar equipamentos ativos
        var equipamentos = await _db.Equipamentos
            .Where(e => e.Ativa)
            .Include(e => e.Categoria)
            .ToListAsync();

        var result = new List<object>();

        foreach (var eq in equipamentos)
        {
            // Buscar checklist de hoje para este equipamento
            var checklistHoje = await _db.Checklists
                .Where(c => c.EquipamentoId == eq.Id && c.DataRealizacao.Date == hoje)
                .Include(c => c.Itens)
                .FirstOrDefaultAsync();

            string status;
            if (checklistHoje == null)
            {
                status = "nao-preenchido"; // cinza
            }
            else
            {
                var temNok = checklistHoje.Itens.Any(i => i.Status == ItemStatus.NOK);
                status = temNok ? "nok" : "ok"; // amarelo ou verde
            }

            result.Add(new
            {
                id = eq.Id,
                codigo = eq.Codigo,
                descricao = eq.Descricao,
                categoriaNome = eq.Categoria?.Nome,
                status,
                checklistId = checklistHoje?.Id,
                criadoEm = checklistHoje?.DataRealizacao
            });
        }

        return Ok(result);
    }

 [HttpGet("checklists")]
public async Task<ActionResult<List<object>>> ListarChecklists(
    [FromQuery] string? dataInicio,
    [FromQuery] string? dataFim,
    [FromQuery] string? status,
    [FromQuery] string? operador)
{
    var query = _db.Checklists
        .Include(c => c.Equipamento)
        .Include(c => c.Operador)
        .Include(c => c.Itens)
        .AsQueryable();

    // Filtro por data - converter para UTC
    if (!string.IsNullOrEmpty(dataInicio))
    {
        var inicio = DateTime.Parse(dataInicio);
        var inicioUtc = DateTime.SpecifyKind(inicio, DateTimeKind.Utc);
        query = query.Where(c => c.DataRealizacao >= inicioUtc);
    }

    if (!string.IsNullOrEmpty(dataFim))
    {
        var fim = DateTime.Parse(dataFim);
        var fimUtc = DateTime.SpecifyKind(fim.AddDays(1), DateTimeKind.Utc);
        query = query.Where(c => c.DataRealizacao < fimUtc);
    }

    // Filtro por status
    if (!string.IsNullOrEmpty(status))
    {
        var statusOk = status.ToLower() == "ok";
        query = query.Where(c => c.Aprovado == statusOk);
    }

    // Filtro por operador
    if (!string.IsNullOrEmpty(operador))
    {
        query = query.Where(c => 
            c.Operador.Nome.ToLower().Contains(operador.ToLower()) ||
            c.Operador.Matricula.Contains(operador));
    }

    var lista = await query
        .OrderByDescending(c => c.DataRealizacao)
        .Select(c => new
        {
            c.Id,
            EquipamentoCodigo = c.Equipamento.Codigo,
            EquipamentoDescricao = c.Equipamento.Descricao,
            OperadorNome = c.Operador.Nome,
            OperadorMatricula = c.Operador.Matricula,
            CriadoEm = c.DataRealizacao,
            Status = c.Aprovado ? "ok" : "nok",
            TotalItens = c.Itens.Count,
            ItensOk = c.Itens.Count(i => i.Status == ItemStatus.OK),
            ItensNok = c.Itens.Count(i => i.Status == ItemStatus.NOK),
        })
        .ToListAsync();

    return Ok(lista);
}
}