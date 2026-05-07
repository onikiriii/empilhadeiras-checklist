using Checklist.Api.Models;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public static class SupervisorNaoOkHistoryBuilder
{
    public static List<ItemNaoOkHistoricoEntryDto> BuildPainelHistorico(ChecklistItem item)
    {
        var operadorNome = item.Checklist.Operador?.Nome ?? "Operador nao informado";
        var entries = new List<ItemNaoOkHistoricoEntryDto>
        {
            new(
                Guid.Empty,
                "Ocorrencia registrada",
                $"{operadorNome} registrou o item {item.Ordem} como nao OK no checklist.",
                item.Checklist.DataRealizacao,
                operadorNome
            ),
        };

        if (item.Acao is null)
        {
            return entries
                .OrderByDescending(x => x.CriadoEm)
                .ToList();
        }

        var hasAssignedHistory = item.Acao.Historico.Any(h =>
            string.Equals(h.Titulo, "Tratativa atribuida", StringComparison.OrdinalIgnoreCase));

        if (!hasAssignedHistory)
        {
            entries.Add(new ItemNaoOkHistoricoEntryDto(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "Tratativa atribuida",
                BuildFallbackAssignedHistoryDescription(item),
                item.Acao.AprovadoEm,
                item.Acao.AprovadoPorSupervisor is null
                    ? "Supervisor"
                    : $"{item.Acao.AprovadoPorSupervisor.Nome} {item.Acao.AprovadoPorSupervisor.Sobrenome}"
            ));
        }

        if (item.Acao.Historico.Count > 0)
        {
            entries.AddRange(item.Acao.Historico
                .OrderByDescending(h => h.CriadoEm)
                .Select(h => new ItemNaoOkHistoricoEntryDto(
                    h.Id,
                    h.Titulo,
                    h.Descricao,
                    h.CriadoEm,
                    $"{h.CriadoPorSupervisor.Nome} {h.CriadoPorSupervisor.Sobrenome}"
                )));
        }
        else if (item.Acao.ConcluidoEm is not null)
        {
            entries.Add(new ItemNaoOkHistoricoEntryDto(
                Guid.NewGuid(),
                "Tratativa concluida",
                $"Tratativa marcada como concluida com percentual final de {item.Acao.PercentualConclusao}%.",
                item.Acao.ConcluidoEm.Value,
                item.Acao.ConcluidoPorSupervisor is null
                    ? "Supervisor"
                    : $"{item.Acao.ConcluidoPorSupervisor.Nome} {item.Acao.ConcluidoPorSupervisor.Sobrenome}"
            ));
        }

        return entries
            .OrderByDescending(x => x.CriadoEm)
            .ToList();
    }

    public static ChecklistItemAcaoHistorico CreateHistoricoEntry(
        ChecklistItemAcao acao,
        Guid criadoPorSupervisorId,
        string titulo,
        string descricao)
    {
        return new ChecklistItemAcaoHistorico
        {
            ChecklistItemAcao = acao,
            CriadoPorSupervisorId = criadoPorSupervisorId,
            Titulo = titulo,
            Descricao = descricao
        };
    }

    public static string BuildTratativaCriadaDescricao(UsuarioSupervisor responsavel, ChecklistItemAcao acao)
    {
        var parts = new List<string>
        {
            $"Responsavel definido: {responsavel.Nome} {responsavel.Sobrenome} ({responsavel.Setor.Nome}).",
            $"Percentual inicial: {acao.PercentualConclusao}%."
        };

        if (acao.DataPrevistaConclusao is not null)
            parts.Add($"Data prevista de conclusao: {SupervisorNaoOkFormattingHelper.FormatHistoryDate(acao.DataPrevistaConclusao)}.");

        if (!string.IsNullOrWhiteSpace(acao.ObservacaoResponsavel))
            parts.Add($"Observacao do responsavel: {acao.ObservacaoResponsavel}.");

        return string.Join(Environment.NewLine, parts);
    }

    public static string BuildFallbackAssignedHistoryDescription(ChecklistItem item)
    {
        var responsavelNome = item.Acao?.ResponsavelSupervisor is null
            ? "Responsavel nao informado"
            : $"{item.Acao.ResponsavelSupervisor.Nome} {item.Acao.ResponsavelSupervisor.Sobrenome}";

        var parts = new List<string>
        {
            $"Responsavel definido: {responsavelNome}.",
            $"Percentual inicial: {item.Acao?.PercentualConclusao ?? 0}%.",
        };

        if (item.Acao?.DataPrevistaConclusao is not null)
            parts.Add($"Data prevista de conclusao: {SupervisorNaoOkFormattingHelper.FormatHistoryDate(item.Acao.DataPrevistaConclusao)}.");

        if (!string.IsNullOrWhiteSpace(item.Acao?.ObservacaoResponsavel))
            parts.Add($"Observacao do responsavel: {item.Acao.ObservacaoResponsavel}.");

        return string.Join(Environment.NewLine, parts);
    }
}
