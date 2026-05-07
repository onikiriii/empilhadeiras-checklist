using Checklist.Api.Models;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public static class SupervisorNaoOkMapper
{
    public static ItemNaoOkPainelItemDto ToPainelItemDto(ChecklistItem item, bool includeHistory = false)
    {
        var setorOrigemNome = item.Checklist.Setor?.Nome ?? "Setor nao informado";
        var equipamentoCodigo = item.Checklist.Equipamento?.Codigo ?? "Equipamento nao informado";
        var equipamentoDescricao = item.Checklist.Equipamento?.Descricao ?? "Descricao nao informada";
        var operadorNome = item.Checklist.Operador?.Nome ?? "Operador nao informado";
        var operadorMatricula = item.Checklist.Operador?.Matricula ?? "-";
        var workflowStatus = item.Acao is null
            ? "pendente-aprovacao"
            : item.Acao.Status == ItemNaoOkAcaoStatus.Concluida
                ? "concluida"
                : "em-andamento";

        return new ItemNaoOkPainelItemDto(
            item.ChecklistId,
            item.Id,
            item.Checklist.DataRealizacao,
            item.Checklist.SetorId,
            setorOrigemNome,
            equipamentoCodigo,
            equipamentoDescricao,
            operadorNome,
            operadorMatricula,
            item.Ordem,
            item.Descricao,
            item.Instrucao,
            item.Observacao,
            item.ImagemNokBase64,
            item.ImagemNokNomeArquivo,
            item.ImagemNokMimeType,
            workflowStatus,
            item.Acao?.ResponsavelSupervisorId,
            item.Acao?.ResponsavelSupervisor is null
                ? null
                : $"{item.Acao.ResponsavelSupervisor.Nome} {item.Acao.ResponsavelSupervisor.Sobrenome}",
            item.Acao?.ResponsavelSetorId,
            item.Acao?.ResponsavelSetor?.Nome,
            item.Acao?.ObservacaoAtribuicao,
            item.Acao?.ObservacaoResponsavel,
            item.Acao?.DataPrevistaConclusao,
            item.Acao?.PercentualConclusao ?? 0,
            item.Acao?.AprovadoEm,
            item.Acao?.AprovadoPorSupervisor is null
                ? null
                : $"{item.Acao.AprovadoPorSupervisor.Nome} {item.Acao.AprovadoPorSupervisor.Sobrenome}",
            item.Acao?.ConcluidoEm,
            item.Acao?.ConcluidoPorSupervisor is null
                ? null
                : $"{item.Acao.ConcluidoPorSupervisor.Nome} {item.Acao.ConcluidoPorSupervisor.Sobrenome}",
            includeHistory ? SupervisorNaoOkHistoryBuilder.BuildPainelHistorico(item) : null
        );
    }
}
