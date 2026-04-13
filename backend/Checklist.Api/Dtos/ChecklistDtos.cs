using System.ComponentModel.DataAnnotations;
using Checklist.Api.Models;

namespace Checklist.Api.Dtos;

public record ChecklistDto(
    Guid Id,
    Guid SetorId,
    Guid EquipamentoId,
    string EquipamentoCodigo,
    Guid OperadorId,
    string OperadorNome,
    DateTime DataRealizacao,
    bool Aprovado,
    string? ObservacoesGerais,
    ChecklistStatus Status,
    string? AssinaturaOperadorBase64,
    List<ChecklistItemDto> Itens
);

public record ChecklistItemDto(
    Guid Id,
    Guid TemplateId,
    int Ordem,
    string Descricao,
    string? Instrucao,
    ItemStatus Status,
    string? Observacao,
    string? ImagemNokBase64,
    string? ImagemNokNomeArquivo,
    string? ImagemNokMimeType
);

public record EnviarChecklistRequest(
    [Required] Guid EquipamentoId,
    [Required] Guid OperadorId,
    [Required] List<EnviarChecklistItemRequest> Itens,
    string? ObservacoesGerais,
    [Required] string AssinaturaOperadorBase64
);

public record EnviarChecklistItemRequest(
    [Required] Guid TemplateId,
    [Required] ItemStatus Status,
    string? Observacao,
    string? ImagemNokBase64,
    string? ImagemNokNomeArquivo,
    string? ImagemNokMimeType
);

public record ItemNaoOkDto(
    Guid ChecklistId,
    Guid ChecklistItemId,
    DateTime DataRealizacao,
    string EquipamentoCodigo,
    string EquipamentoDescricao,
    string OperadorNome,
    string OperadorMatricula,
    int Ordem,
    string Descricao,
    string? Instrucao,
    string? Observacao,
    string? ImagemNokBase64,
    string? ImagemNokNomeArquivo,
    string? ImagemNokMimeType
);

public record SupervisorResponsavelOptionDto(
    Guid Id,
    string NomeCompleto,
    string Login,
    Guid SetorId,
    string SetorNome
);

public record ItemNaoOkHistoricoEntryDto(
    Guid Id,
    string Titulo,
    string Descricao,
    DateTime CriadoEm,
    string CriadoPorNomeCompleto
);

public record ItemNaoOkPainelItemDto(
    Guid ChecklistId,
    Guid ChecklistItemId,
    DateTime DataRealizacao,
    Guid SetorOrigemId,
    string SetorOrigemNome,
    string EquipamentoCodigo,
    string EquipamentoDescricao,
    string OperadorNome,
    string OperadorMatricula,
    int Ordem,
    string Descricao,
    string? Instrucao,
    string? Observacao,
    string? ImagemNokBase64,
    string? ImagemNokNomeArquivo,
    string? ImagemNokMimeType,
    string WorkflowStatus,
    Guid? ResponsavelSupervisorId,
    string? ResponsavelNomeCompleto,
    Guid? ResponsavelSetorId,
    string? ResponsavelSetorNome,
    string? ObservacaoAtribuicao,
    string? ObservacaoResponsavel,
    DateTime? DataPrevistaConclusao,
    int PercentualConclusao,
    DateTime? AprovadoEm,
    string? AprovadoPorNomeCompleto,
    DateTime? ConcluidoEm,
    string? ConcluidoPorNomeCompleto,
    List<ItemNaoOkHistoricoEntryDto>? Historico
);

public record ItemNaoOkPainelDto(
    List<ItemNaoOkPainelItemDto> PendentesAprovacao,
    List<ItemNaoOkPainelItemDto> EmAndamento,
    List<ItemNaoOkPainelItemDto> Concluidas
);

public record AtribuirItemNaoOkRequest(
    [Required] Guid ResponsavelSupervisorId,
    string? ObservacaoAtribuicao,
    string? ObservacaoResponsavel,
    DateTime? DataPrevistaConclusao,
    [Range(0, 100)] int PercentualConclusao
);

public record AtualizarTratativaItemNaoOkRequest(
    [Required] Guid ResponsavelSupervisorId,
    string? ObservacaoResponsavel,
    DateTime? DataPrevistaConclusao,
    [Range(0, 100)] int PercentualConclusao
);
