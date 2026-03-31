using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record FechamentoChecklistMensalResumoDto(
    Guid Id,
    Guid EquipamentoId,
    string EquipamentoCodigo,
    string EquipamentoDescricao,
    int Ano,
    int Mes,
    int QuantidadeChecklists,
    string TemplateVersao,
    string NomeArquivoPdf,
    DateTime FechadoEm,
    string FechadoPorNome
);

public record FechamentoChecklistMensalPreviewDto(
    bool JaFechado,
    Guid? FechamentoId,
    Guid EquipamentoId,
    string EquipamentoCodigo,
    string EquipamentoDescricao,
    string SetorNome,
    int Ano,
    int Mes,
    int TotalDiasComChecklist,
    int TotalChecklistsConsiderados,
    IReadOnlyList<FechamentoChecklistMensalLinhaDto> Linhas,
    IReadOnlyList<FechamentoChecklistMensalDiaDto> Dias,
    IReadOnlyList<string> Comentarios,
    IReadOnlyList<string> OperadoresConsolidados,
    IReadOnlyList<string> Avisos
);

public record FechamentoChecklistMensalLinhaDto(
    int Ordem,
    string Descricao,
    IReadOnlyList<string?> ValoresPorDia
);

public record FechamentoChecklistMensalDiaDto(
    int Dia,
    Guid ChecklistId,
    string OperadorNome,
    string OperadorMatricula,
    DateTime DataRealizacao
);

public record FecharChecklistMensalRequest(
    [Required] Guid EquipamentoId,
    [Range(2000, 3000)] int Ano,
    [Range(1, 12)] int Mes
);
