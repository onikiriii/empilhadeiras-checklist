using Checklist.Api.Controllers.Features.Supervisor.Common;
using Checklist.Api.Data;
using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public class SupervisorNaoOkQueryService
{
    private readonly AppDbContext _db;

    public SupervisorNaoOkQueryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ItemNaoOkDto>> ListarItensNaoOkAsync(SupervisorContext context, ItemNaoOkFiltersDto filters)
    {
        var query = _db.ChecklistItens
            .AsNoTracking()
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Where(i =>
                i.Checklist.SetorId == context.SetorId &&
                i.Status == ItemStatus.NOK)
            .AsQueryable();

        query = ApplyCommonFilters(query, filters);

        return await query
            .OrderByDescending(i => i.Checklist.DataRealizacao)
            .ThenBy(i => i.Checklist.Equipamento.Codigo)
            .ThenBy(i => i.Ordem)
            .Select(i => new ItemNaoOkDto(
                i.ChecklistId,
                i.Id,
                i.Checklist.DataRealizacao,
                i.Checklist.Equipamento.Codigo,
                i.Checklist.Equipamento.Descricao,
                i.Checklist.Operador.Nome,
                i.Checklist.Operador.Matricula,
                i.Ordem,
                i.Descricao,
                i.Instrucao,
                i.Observacao,
                i.ImagemNokBase64,
                i.ImagemNokNomeArquivo,
                i.ImagemNokMimeType
            ))
            .ToListAsync();
    }

    public async Task<ItemNaoOkPainelDto> ObterPainelAsync(SupervisorContext context, ItemNaoOkFiltersDto filters)
    {
        var query = BuildPainelQuery(context);
        query = ApplyCommonFilters(query, filters);

        var itens = (await query
            .OrderByDescending(i => i.Checklist.DataRealizacao)
            .ThenBy(i => i.Checklist.Equipamento.Codigo)
            .ThenBy(i => i.Ordem)
            .ToListAsync())
            .Select(i => SupervisorNaoOkMapper.ToPainelItemDto(i, includeHistory: true))
            .ToList();

        return new ItemNaoOkPainelDto(
            itens.Where(i => i.WorkflowStatus == "pendente-aprovacao").ToList(),
            itens.Where(i => i.WorkflowStatus == "em-andamento").ToList(),
            itens.Where(i => i.WorkflowStatus == "concluida").ToList()
        );
    }

    public async Task<List<SupervisorResponsavelOptionDto>> ListarResponsaveisAsync(SupervisorContext context)
    {
        return await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .Where(x => x.Ativo && !x.IsMaster && x.Setor.Ativo)
            .OrderBy(x => x.Setor.Nome)
            .ThenBy(x => x.Nome)
            .ThenBy(x => x.Sobrenome)
            .Select(x => new SupervisorResponsavelOptionDto(
                x.Id,
                $"{x.Nome} {x.Sobrenome}",
                x.Login,
                x.SetorId,
                x.Setor.Nome
            ))
            .ToListAsync();
    }

    public async Task<SupervisorOperationResult<ItemNaoOkPainelItemDto>> ObterItemAsync(SupervisorContext context, Guid checklistItemId)
    {
        var item = await BuildPainelQuery(context)
            .FirstOrDefaultAsync(i => i.Id == checklistItemId);

        if (item is null)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status404NotFound, "Item nao OK nao encontrado.");

        return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Ok(
            SupervisorNaoOkMapper.ToPainelItemDto(item, includeHistory: true));
    }

    public async Task<ItemNaoOkPainelItemDto> LoadPainelItemDtoAsync(Guid checklistItemId)
    {
        var item = await _db.ChecklistItens
            .AsNoTracking()
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Setor)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSetor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.AprovadoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ConcluidoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
                    .ThenInclude(h => h.CriadoPorSupervisor)
            .FirstAsync(i => i.Id == checklistItemId);

        return SupervisorNaoOkMapper.ToPainelItemDto(item, includeHistory: true);
    }

    private IQueryable<ChecklistItem> BuildPainelQuery(SupervisorContext context)
    {
        return _db.ChecklistItens
            .AsNoTracking()
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Setor)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSetor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.AprovadoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ConcluidoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
                    .ThenInclude(h => h.CriadoPorSupervisor)
            .Where(i =>
                i.Status == ItemStatus.NOK &&
                (
                    (i.Checklist.SetorId == context.SetorId && i.Acao == null) ||
                    (i.Acao != null &&
                     (i.Checklist.SetorId == context.SetorId ||
                      i.Acao.ResponsavelSupervisorId == context.SupervisorId ||
                      i.Acao.ResponsavelSetorId == context.SetorId))
                ));
    }

    private static IQueryable<ChecklistItem> ApplyCommonFilters(IQueryable<ChecklistItem> query, ItemNaoOkFiltersDto filters)
    {
        if (!string.IsNullOrWhiteSpace(filters.DataInicio))
        {
            var inicio = DateTime.Parse(filters.DataInicio);
            var inicioUtc = new DateTime(inicio.Year, inicio.Month, inicio.Day, 0, 0, 0, DateTimeKind.Utc);
            query = query.Where(i => i.Checklist.DataReferencia >= inicioUtc);
        }

        if (!string.IsNullOrWhiteSpace(filters.DataFim))
        {
            var fim = DateTime.Parse(filters.DataFim);
            var fimUtc = new DateTime(fim.Year, fim.Month, fim.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            query = query.Where(i => i.Checklist.DataReferencia < fimUtc);
        }

        if (!string.IsNullOrWhiteSpace(filters.Equipamento))
        {
            var equipamentoNormalizado = filters.Equipamento.Trim().ToLower();
            query = query.Where(i =>
                i.Checklist.Equipamento.Codigo.ToLower().Contains(equipamentoNormalizado) ||
                i.Checklist.Equipamento.Descricao.ToLower().Contains(equipamentoNormalizado));
        }

        if (!string.IsNullOrWhiteSpace(filters.Operador))
        {
            var operadorNormalizado = filters.Operador.Trim().ToLower();
            query = query.Where(i =>
                i.Checklist.Operador.Nome.ToLower().Contains(operadorNormalizado) ||
                i.Checklist.Operador.Matricula.Contains(filters.Operador));
        }

        return query;
    }
}
