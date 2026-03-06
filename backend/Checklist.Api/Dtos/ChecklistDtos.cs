using System.ComponentModel.DataAnnotations;
using Checklist.Api.Models;

namespace Checklist.Api.Dtos;

public record ChecklistDto(
    Guid Id,
    Guid EquipamentoId,
    string EquipamentoCodigo,
    Guid OperadorId,
    string OperadorNome,
    DateTime DataRealizacao,
    bool Aprovado,
    string? ObservacoesGerais,
    ChecklistStatus Status,
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
    string? ObservacoesGerais
);

public record EnviarChecklistItemRequest(
    [Required] Guid TemplateId,
    [Required] ItemStatus Status,
    string? Observacao
);