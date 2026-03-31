using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record SetorDto(
    Guid Id,
    string Nome,
    string? Descricao,
    bool Ativo,
    DateTime CriadoEm,
    int SupervisoresCount,
    int EquipamentosCount,
    int OperadoresCount
);

public record CriarSetorRequest(
    [Required] string Nome,
    string? Descricao = null,
    bool Ativo = true
);

public record AtualizarSetorRequest(
    [Required] string Nome,
    string? Descricao = null,
    bool Ativo = true
);
