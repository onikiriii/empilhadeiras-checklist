using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor")]
public class SupervisorController : ControllerBase
{
    private readonly AppDbContext _db;

    public SupervisorController(AppDbContext db) => _db = db;

    public record EquipamentoStatusDto(string Codigo, string Descricao, bool TemChecklistHoje);

    [HttpGet("equipamentos-status")]
    public async Task<ActionResult<List<EquipamentoStatusDto>>> ObterStatusEquipamentos()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var hojeInicio = DateTime.Today;
        var hojeFim = hojeInicio.AddDays(1);

        var lista = await _db.Equipamentos
            .AsNoTracking()
            .Where(e => e.Ativa && e.SetorId == setorId.Value)
            .OrderBy(e => e.Codigo)
            .Select(e => new EquipamentoStatusDto(
                e.Codigo,
                e.Descricao,
                _db.Checklists.Any(c => c.EquipamentoId == e.Id && c.SetorId == setorId.Value && c.DataRealizacao >= hojeInicio && c.DataRealizacao < hojeFim)
            ))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("checklist/{codigo}/hoje")]
    public async Task<ActionResult<ChecklistDto>> ObterChecklistHoje(string codigo)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        codigo = (codigo ?? "").Trim().ToUpperInvariant();

        var hojeInicio = DateTime.Today;
        var hojeFim = hojeInicio.AddDays(1);

        var checklist = await _db.Checklists
            .AsNoTracking()
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .Where(c => c.SetorId == setorId.Value &&
                        c.Equipamento.Codigo == codigo &&
                        c.DataRealizacao >= hojeInicio &&
                        c.DataRealizacao < hojeFim)
            .FirstOrDefaultAsync();

        if (checklist is null)
            return NotFound(new { message = "Nenhum checklist encontrado para hoje neste equipamento." });

        var dto = new ChecklistDto(
            checklist.Id,
            checklist.SetorId,
            checklist.EquipamentoId,
            checklist.Equipamento.Codigo,
            checklist.OperadorId,
            checklist.Operador.Nome,
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

        return Ok(dto);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var hoje = DateTime.UtcNow.Date;

        var equipamentos = await _db.Equipamentos
            .Where(e => e.Ativa && e.SetorId == setorId.Value)
            .Include(e => e.Categoria)
            .ToListAsync();

        var result = new List<object>();

        foreach (var eq in equipamentos)
        {
            var checklistHoje = await _db.Checklists
                .Where(c => c.SetorId == setorId.Value && c.EquipamentoId == eq.Id && c.DataRealizacao.Date == hoje)
                .Include(c => c.Itens)
                .FirstOrDefaultAsync();

            var status = checklistHoje is null
                ? "nao-preenchido"
                : checklistHoje.Itens.Any(i => i.Status == ItemStatus.NOK) ? "nok" : "ok";

            result.Add(new
            {
                id = eq.Id,
                setorId = eq.SetorId,
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
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var query = _db.Checklists
            .Where(c => c.SetorId == setorId.Value)
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .AsQueryable();

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

        if (!string.IsNullOrEmpty(status))
        {
            var statusOk = status.ToLower() == "ok";
            query = query.Where(c => c.Aprovado == statusOk);
        }

        if (!string.IsNullOrEmpty(operador))
        {
            var operadorNormalizado = operador.ToLower();
            query = query.Where(c =>
                c.Operador.Nome.ToLower().Contains(operadorNormalizado) ||
                c.Operador.Matricula.Contains(operador));
        }

        var lista = await query
            .OrderByDescending(c => c.DataRealizacao)
            .Select(c => new
            {
                c.Id,
                c.SetorId,
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
