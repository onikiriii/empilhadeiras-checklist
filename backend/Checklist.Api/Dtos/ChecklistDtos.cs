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
    string? Observacao
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
    string? Observacao
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
    string? Observacao
);

public record SupervisorResponsavelOptionDto(
    Guid Id,
    string NomeCompleto,
    string Login,
    Guid SetorId,
    string SetorNome
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
    string WorkflowStatus,
    Guid? ResponsavelSupervisorId,
    string? ResponsavelNomeCompleto,
    Guid? ResponsavelSetorId,
    string? ResponsavelSetorNome,
    string? ObservacaoAtribuicao,
    DateTime? AprovadoEm,
    string? AprovadoPorNomeCompleto,
    DateTime? ConcluidoEm,
    string? ConcluidoPorNomeCompleto
);

public record ItemNaoOkPainelDto(
    List<ItemNaoOkPainelItemDto> PendentesAprovacao,
    List<ItemNaoOkPainelItemDto> EmAndamento,
    List<ItemNaoOkPainelItemDto> Concluidas
);

public record AtribuirItemNaoOkRequest(
    [Required] Guid ResponsavelSupervisorId,
    string? ObservacaoAtribuicao
);
