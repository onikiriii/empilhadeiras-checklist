using Checklist.Api.Controllers.Features.Supervisor.Common;
using Checklist.Api.Data;
using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public class SupervisorNaoOkWorkflowService
{
    private readonly AppDbContext _db;
    private readonly SupervisorNaoOkQueryService _queryService;

    public SupervisorNaoOkWorkflowService(AppDbContext db, SupervisorNaoOkQueryService queryService)
    {
        _db = db;
        _queryService = queryService;
    }

    public async Task<SupervisorOperationResult<ItemNaoOkPainelItemDto>> AtribuirAsync(
        SupervisorContext context,
        Guid checklistItemId,
        AtribuirItemNaoOkRequest request)
    {
        var item = await _db.ChecklistItens
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Setor)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Include(i => i.Acao)
            .FirstOrDefaultAsync(i => i.Id == checklistItemId);

        if (item is null)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status404NotFound, "Item nao OK nao encontrado.");

        if (item.Checklist.SetorId != context.SetorId)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status403Forbidden, "Supervisor sem permissao para atribuir este item.");

        if (item.Status != ItemStatus.NOK)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status400BadRequest, "Apenas itens NOK podem virar tratativas.");

        if (item.Acao is not null)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status409Conflict, "Este item ja possui uma tratativa registrada.");

        var responsavel = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Id == request.ResponsavelSupervisorId && x.Ativo && !x.IsMaster);

        if (responsavel is null || !responsavel.Setor.Ativo)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status400BadRequest, "Responsavel informado nao esta disponivel para atribuicao.");

        var acao = new ChecklistItemAcao
        {
            ChecklistItemId = item.Id,
            Status = ItemNaoOkAcaoStatus.EmAndamento,
            AprovadoPorSupervisorId = context.SupervisorId,
            AprovadoEm = DateTime.UtcNow,
            ResponsavelSupervisorId = responsavel.Id,
            ResponsavelSetorId = responsavel.SetorId,
            ObservacaoAtribuicao = SupervisorNaoOkFormattingHelper.NormalizeOptionalText(request.ObservacaoAtribuicao),
            ObservacaoResponsavel = SupervisorNaoOkFormattingHelper.NormalizeOptionalText(request.ObservacaoResponsavel),
            DataPrevistaConclusao = SupervisorNaoOkFormattingHelper.NormalizeDateOnly(request.DataPrevistaConclusao),
            PercentualConclusao = SupervisorNaoOkFormattingHelper.NormalizePercentualConclusao(request.PercentualConclusao)
        };

        _db.ChecklistItensAcoes.Add(acao);
        _db.ChecklistItensAcoesHistorico.Add(SupervisorNaoOkHistoryBuilder.CreateHistoricoEntry(
            acao,
            context.SupervisorId,
            "Tratativa atribuida",
            SupervisorNaoOkHistoryBuilder.BuildTratativaCriadaDescricao(responsavel, acao)
        ));
        await _db.SaveChangesAsync();

        var dto = await _queryService.LoadPainelItemDtoAsync(item.Id);
        return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Ok(dto);
    }

    public async Task<SupervisorOperationResult<ItemNaoOkPainelItemDto>> AtualizarTratativaAsync(
        SupervisorContext context,
        Guid checklistItemId,
        AtualizarTratativaItemNaoOkRequest request)
    {
        var item = await _db.ChecklistItens
            .Include(i => i.Checklist)
            .Include(i => i.Acao)
            .FirstOrDefaultAsync(i => i.Id == checklistItemId);

        if (item is null)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status404NotFound, "Item nao OK nao encontrado.");

        if (item.Status != ItemStatus.NOK)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status400BadRequest, "Apenas itens NOK podem ser editados neste fluxo.");

        if (item.Acao is null)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status400BadRequest, "Este item ainda nao possui tratativa para ser editada.");

        if (item.Acao.Status == ItemNaoOkAcaoStatus.Concluida)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status409Conflict, "Tratativas concluidas nao podem ser editadas.");

        var podeEditar = item.Checklist.SetorId == context.SetorId ||
                         item.Acao.ResponsavelSupervisorId == context.SupervisorId ||
                         item.Acao.ResponsavelSetorId == context.SetorId;

        if (!podeEditar)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status403Forbidden, "Supervisor sem permissao para editar esta tratativa.");

        var responsavel = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Id == request.ResponsavelSupervisorId && x.Ativo && !x.IsMaster);

        if (responsavel is null || !responsavel.Setor.Ativo)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status400BadRequest, "Responsavel informado nao esta disponivel para atribuicao.");

        var changes = new List<string>();
        var normalizedObservacaoResponsavel = SupervisorNaoOkFormattingHelper.NormalizeOptionalText(request.ObservacaoResponsavel);
        var normalizedDataPrevista = SupervisorNaoOkFormattingHelper.NormalizeDateOnly(request.DataPrevistaConclusao);
        var normalizedPercentual = SupervisorNaoOkFormattingHelper.NormalizePercentualConclusao(request.PercentualConclusao);

        if (item.Acao.ResponsavelSupervisorId != responsavel.Id)
        {
            changes.Add($"Responsavel alterado para {responsavel.Nome} {responsavel.Sobrenome} ({responsavel.Setor.Nome}).");
            item.Acao.ResponsavelSupervisorId = responsavel.Id;
            item.Acao.ResponsavelSetorId = responsavel.SetorId;
        }

        if (!string.Equals(item.Acao.ObservacaoResponsavel, normalizedObservacaoResponsavel, StringComparison.Ordinal))
        {
            changes.Add($"Observacao do responsavel alterada de {SupervisorNaoOkFormattingHelper.DescribeOptional(item.Acao.ObservacaoResponsavel)} para {SupervisorNaoOkFormattingHelper.DescribeOptional(normalizedObservacaoResponsavel)}.");
            item.Acao.ObservacaoResponsavel = normalizedObservacaoResponsavel;
        }

        if (item.Acao.DataPrevistaConclusao != normalizedDataPrevista)
        {
            changes.Add($"Data prevista alterada de {SupervisorNaoOkFormattingHelper.FormatHistoryDate(item.Acao.DataPrevistaConclusao)} para {SupervisorNaoOkFormattingHelper.FormatHistoryDate(normalizedDataPrevista)}.");
            item.Acao.DataPrevistaConclusao = normalizedDataPrevista;
        }

        if (item.Acao.PercentualConclusao != normalizedPercentual)
        {
            changes.Add($"Percentual de conclusao alterado de {item.Acao.PercentualConclusao}% para {normalizedPercentual}%.");
            item.Acao.PercentualConclusao = normalizedPercentual;
        }

        if (changes.Count == 0)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Ok(await _queryService.LoadPainelItemDtoAsync(item.Id));

        _db.ChecklistItensAcoesHistorico.Add(SupervisorNaoOkHistoryBuilder.CreateHistoricoEntry(
            item.Acao,
            context.SupervisorId,
            "Tratativa atualizada",
            string.Join(Environment.NewLine, changes)
        ));

        await _db.SaveChangesAsync();

        return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Ok(await _queryService.LoadPainelItemDtoAsync(item.Id));
    }

    public async Task<SupervisorOperationResult<ItemNaoOkPainelItemDto>> ConcluirAsync(
        SupervisorContext context,
        Guid checklistItemId)
    {
        var item = await _db.ChecklistItens
            .Include(i => i.Checklist)
            .Include(i => i.Acao)
            .FirstOrDefaultAsync(i => i.Id == checklistItemId);

        if (item is null)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status404NotFound, "Item nao OK nao encontrado.");

        if (item.Status != ItemStatus.NOK)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status400BadRequest, "Apenas itens NOK podem ser concluidos neste fluxo.");

        var podeConcluir = item.Checklist.SetorId == context.SetorId ||
                           item.Acao?.ResponsavelSupervisorId == context.SupervisorId ||
                           item.Acao?.ResponsavelSetorId == context.SetorId;

        if (!podeConcluir)
            return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status403Forbidden, "Supervisor sem permissao para concluir esta tratativa.");

        if (item.Acao is null)
        {
            var acao = new ChecklistItemAcao
            {
                ChecklistItemId = item.Id,
                Status = ItemNaoOkAcaoStatus.Concluida,
                AprovadoPorSupervisorId = context.SupervisorId,
                AprovadoEm = DateTime.UtcNow,
                ResponsavelSupervisorId = context.SupervisorId,
                ResponsavelSetorId = context.SetorId,
                PercentualConclusao = 100,
                ConcluidoPorSupervisorId = context.SupervisorId,
                ConcluidoEm = DateTime.UtcNow
            };

            _db.ChecklistItensAcoes.Add(acao);
            _db.ChecklistItensAcoesHistorico.Add(SupervisorNaoOkHistoryBuilder.CreateHistoricoEntry(
                acao,
                context.SupervisorId,
                "Tratativa concluida",
                "O item foi concluido diretamente, sem atribuicao previa."
            ));
        }
        else
        {
            if (item.Acao.Status == ItemNaoOkAcaoStatus.Concluida)
                return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Fail(StatusCodes.Status409Conflict, "Esta tratativa ja esta concluida.");

            item.Acao.Status = ItemNaoOkAcaoStatus.Concluida;
            item.Acao.PercentualConclusao = 100;
            item.Acao.ConcluidoPorSupervisorId = context.SupervisorId;
            item.Acao.ConcluidoEm = DateTime.UtcNow;

            if (item.Acao.ResponsavelSupervisorId is null)
            {
                item.Acao.ResponsavelSupervisorId = context.SupervisorId;
                item.Acao.ResponsavelSetorId = context.SetorId;
            }

            _db.ChecklistItensAcoesHistorico.Add(SupervisorNaoOkHistoryBuilder.CreateHistoricoEntry(
                item.Acao,
                context.SupervisorId,
                "Tratativa concluida",
                $"Tratativa marcada como concluida com percentual final de {item.Acao.PercentualConclusao}%."
            ));
        }

        await _db.SaveChangesAsync();

        return SupervisorOperationResult<ItemNaoOkPainelItemDto>.Ok(await _queryService.LoadPainelItemDtoAsync(item.Id));
    }
}
