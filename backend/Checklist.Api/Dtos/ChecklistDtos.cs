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
