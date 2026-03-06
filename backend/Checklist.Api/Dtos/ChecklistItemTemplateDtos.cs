using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record ChecklistItemTemplateDto(
    Guid Id,
    Guid CategoriaId,
    int Ordem,
    string Descricao,
    string? Instrucao,
    bool Ativo
);

public record CriarChecklistItemTemplateRequest(
    [Required] Guid CategoriaId,
    [Required] int Ordem,
    [Required] string Descricao,
    string? Instrucao,
    bool Ativo = true
);

public record AtualizarChecklistItemTemplateRequest(
    [Required] int Ordem,
    [Required] string Descricao,
    string? Instrucao,
    bool Ativo
);