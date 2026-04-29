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

public record StpAreaChecklistSelectableSetorDto(
    Guid Id,
    string Nome
);

public record StpAreaResponsavelSupervisorDto(
    Guid Id,
    string NomeCompleto
);

public record StpAreaInspecaoDto(
    Guid Id,
    Guid SetorId,
    string Nome,
    Guid ResponsavelSupervisorId,
    string ResponsavelSupervisorNomeCompleto,
    bool Ativa
);

public record CriarOuAtualizarStpAreaInspecaoRequest(
    [Required] string Nome,
    [Required] Guid ResponsavelSupervisorId,
    bool Ativa = true
);

public record EnviarStpAreaChecklistItemRequest(
    [Required] Guid TemplateItemId,
    [Required] StpAreaChecklistResultado Resultado,
    string? Observacao
);

public record EnviarStpAreaChecklistRequest(
    [Required] Guid TemplateId,
    [Required] Guid AreaInspecaoId,
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
    Guid? AreaInspecaoId,
    string AreaInspecaoNome,
    Guid? ResponsavelAreaSupervisorId,
    string ResponsavelAreaNomeCompleto,
    int TotalItens,
    int TotalCheck,
    int TotalX
);

public record StpAreaChecklistDetailDto(
    Guid Id,
    Guid SetorId,
    Guid? AreaInspecaoId,
    string AreaInspecaoNome,
    Guid TemplateId,
    string TemplateCodigo,
    string TemplateNome,
    DateTime DataRealizacao,
    DateTime DataReferencia,
    Guid InspetorSupervisorId,
    string InspetorNomeCompleto,
    Guid? ResponsavelAreaSupervisorId,
    string ResponsavelAreaNomeCompleto,
    string? ComportamentosPreventivosObservados,
    string? AtosInsegurosObservados,
    string? CondicoesInsegurasConstatadas,
    string AssinaturaInspetorBase64,
    string AssinaturaResponsavelPresenteBase64,
    IReadOnlyList<StpAreaChecklistItemDto> Itens
);
