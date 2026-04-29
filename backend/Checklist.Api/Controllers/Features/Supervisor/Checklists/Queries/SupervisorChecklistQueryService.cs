using Checklist.Api.Controllers.Features.Supervisor.Common;
using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Support;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers.Features.Supervisor.Checklists;

public class SupervisorChecklistQueryService
{
    private readonly AppDbContext _db;

    public SupervisorChecklistQueryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<SupervisorOperationResult<ChecklistDto>> ObterChecklistHojeAsync(SupervisorContext context, string codigo)
    {
        var hoje = BusinessDate.TodayKeyUtc();
        var codigoNormalizado = (codigo ?? string.Empty).Trim().ToUpperInvariant();

        var checklist = await _db.Checklists
            .AsNoTracking()
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .Where(c => c.SetorId == context.SetorId && c.Equipamento.Codigo == codigoNormalizado && c.DataReferencia == hoje)
            .OrderByDescending(c => c.DataRealizacao)
            .FirstOrDefaultAsync();

        if (checklist is null)
            return SupervisorOperationResult<ChecklistDto>.Fail(StatusCodes.Status404NotFound, "Nenhum checklist encontrado para hoje neste equipamento.");

        return SupervisorOperationResult<ChecklistDto>.Ok(ToChecklistDto(checklist));
    }

    public async Task<List<SupervisorChecklistListItemDto>> ListarChecklistsAsync(SupervisorContext context, SupervisorChecklistFiltersDto filters)
    {
        var query = _db.Checklists
            .AsNoTracking()
            .Where(c => c.SetorId == context.SetorId)
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filters.DataInicio))
        {
            var inicio = DateTime.Parse(filters.DataInicio);
            var inicioUtc = new DateTime(inicio.Year, inicio.Month, inicio.Day, 0, 0, 0, DateTimeKind.Utc);
            query = query.Where(c => c.DataReferencia >= inicioUtc);
        }

        if (!string.IsNullOrEmpty(filters.DataFim))
        {
            var fim = DateTime.Parse(filters.DataFim);
            var fimUtc = new DateTime(fim.Year, fim.Month, fim.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            query = query.Where(c => c.DataReferencia < fimUtc);
        }

        if (!string.IsNullOrEmpty(filters.Status))
        {
            var statusOk = filters.Status.ToLower() == "ok";
            query = query.Where(c => c.Aprovado == statusOk);
        }

        if (!string.IsNullOrEmpty(filters.Operador))
        {
            var operadorNormalizado = filters.Operador.ToLower();
            query = query.Where(c =>
                c.Operador.Nome.ToLower().Contains(operadorNormalizado) ||
                c.Operador.Matricula.Contains(filters.Operador));
        }

        return await query
            .OrderByDescending(c => c.DataRealizacao)
            .Select(c => new SupervisorChecklistListItemDto(
                c.Id,
                c.SetorId,
                c.Equipamento.Codigo,
                c.Equipamento.Descricao,
                c.Operador.Nome,
                c.Operador.Matricula,
                c.DataRealizacao,
                c.Aprovado ? "ok" : "nok",
                c.Itens.Count,
                c.Itens.Count(i => i.Status == ItemStatus.OK),
                c.Itens.Count(i => i.Status == ItemStatus.NOK)
            ))
            .ToListAsync();
    }

    private static ChecklistDto ToChecklistDto(Models.Checklist checklist)
    {
        return new ChecklistDto(
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
                i.Observacao,
                i.ImagemNokBase64,
                i.ImagemNokNomeArquivo,
                i.ImagemNokMimeType
            )).ToList()
        );
    }
}
