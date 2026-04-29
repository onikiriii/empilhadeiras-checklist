using Checklist.Api.Controllers.Features.Supervisor.Common;
using Checklist.Api.Data;
using Checklist.Api.Models;
using Checklist.Api.Support;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers.Features.Supervisor.Dashboard;

public class SupervisorDashboardQueryService
{
    private readonly AppDbContext _db;

    public SupervisorDashboardQueryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<EquipamentoStatusDto>> GetEquipamentosStatusAsync(SupervisorContext context)
    {
        var hoje = BusinessDate.TodayKeyUtc();

        return await _db.Equipamentos
            .AsNoTracking()
            .Where(e => e.Ativa && e.SetorId == context.SetorId)
            .OrderBy(e => e.Codigo)
            .Select(e => new EquipamentoStatusDto(
                e.Codigo,
                e.Descricao,
                _db.Checklists.Any(c =>
                    c.EquipamentoId == e.Id &&
                    c.SetorId == context.SetorId &&
                    c.DataReferencia == hoje)
            ))
            .ToListAsync();
    }

    public async Task<List<SupervisorDashboardItemDto>> GetDashboardAsync(SupervisorContext context)
    {
        var hoje = BusinessDate.TodayKeyUtc();

        var equipamentos = await _db.Equipamentos
            .AsNoTracking()
            .Where(e => e.Ativa && e.SetorId == context.SetorId)
            .Include(e => e.Categoria)
            .ToListAsync();

        var result = new List<SupervisorDashboardItemDto>();

        foreach (var eq in equipamentos)
        {
            var checklistHoje = await _db.Checklists
                .AsNoTracking()
                .Where(c =>
                    c.SetorId == context.SetorId &&
                    c.EquipamentoId == eq.Id &&
                    c.DataReferencia == hoje)
                .Include(c => c.Itens)
                .FirstOrDefaultAsync();

            var status = checklistHoje is null
                ? "nao-preenchido"
                : checklistHoje.Itens.Any(i => i.Status == ItemStatus.NOK)
                    ? "nok"
                    : "ok";

            result.Add(new SupervisorDashboardItemDto(
                eq.Id,
                eq.SetorId,
                eq.Codigo,
                eq.Descricao,
                eq.Categoria?.Nome,
                status,
                checklistHoje?.Id,
                checklistHoje?.DataRealizacao
            ));
        }

        return result;
    }
}
