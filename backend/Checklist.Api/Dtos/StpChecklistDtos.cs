using System.ComponentModel.DataAnnotations;
using Checklist.Api.Models;

namespace Checklist.Api.Dtos;

public record StpAreaChecklistTemplateSummaryDto(
    Guid Id,
    Guid SetorId,
    string Codigo,
    string Nome,
    bool Ativo,
    int TotalItens
);

public record StpAreaChecklistTemplateItemDto(
    Guid Id,
    int Ordem,
    string Descricao,
    string? Instrucao,
    bool Ativo
);

public record StpAreaChecklistTemplateDetailDto(
    Guid Id,
    Guid SetorId,
    string Codigo,
    string Nome,
    bool Ativo,
    IReadOnlyList<StpAreaChecklistTemplateItemDto> Itens
);

public record EnviarStpAreaChecklistItemRequest(
    [Required] Guid TemplateItemId,
    [Required] StpAreaChecklistResultado Resultado,
    string? Observacao
);

public record EnviarStpAreaChecklistRequest(
    [Required] Guid TemplateId,
    [Required] string ResponsavelPresenteNome,
    string? ResponsavelPresenteCargo,
    string? ComportamentosPreventivosObservados,
    string? AtosInsegurosObservados,
    string? CondicoesInsegurasConstatadas,
    [Required] string AssinaturaInspetorBase64,
    [Required] string AssinaturaResponsavelPresenteBase64,
    [Required] IReadOnlyList<EnviarStpAreaChecklistItemRequest> Itens
);

public record StpAreaChecklistItemDto(
    Guid Id,
    Guid TemplateItemId,
    int Ordem,
    string Descricao,
    string? Instrucao,
    StpAreaChecklistResultado Resultado,
    string? Observacao
);

public record StpAreaChecklistListItemDto(
    Guid Id,
    Guid TemplateId,
    string TemplateCodigo,
    string TemplateNome,
    DateTime DataRealizacao,
    string InspetorNomeCompleto,
    string ResponsavelPresenteNome,
    string? ResponsavelPresenteCargo,
    int TotalItens,
    int TotalCheck,
    int TotalX
);

public record StpAreaChecklistDetailDto(
    Guid Id,
    Guid SetorId,
    Guid TemplateId,
    string TemplateCodigo,
    string TemplateNome,
    DateTime DataRealizacao,
    DateTime DataReferencia,
    Guid InspetorSupervisorId,
    string InspetorNomeCompleto,
    string ResponsavelPresenteNome,
    string? ResponsavelPresenteCargo,
    string? ComportamentosPreventivosObservados,
    string? AtosInsegurosObservados,
    string? CondicoesInsegurasConstatadas,
    string AssinaturaInspetorBase64,
    string AssinaturaResponsavelPresenteBase64,
    IReadOnlyList<StpAreaChecklistItemDto> Itens
);
