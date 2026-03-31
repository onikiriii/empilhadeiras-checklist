using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record CategoriaEquipamentoDto(
    Guid Id,
    Guid SetorId,
    string Nome,
    bool Ativa
);

public record CriarCategoriaEquipamentoRequest(
    Guid? SetorId,
    [Required] string Nome,
    bool Ativa = true
);

public record AtualizarCategoriaEquipamentoRequest(
    [Required] string Nome,
    bool Ativa
);
