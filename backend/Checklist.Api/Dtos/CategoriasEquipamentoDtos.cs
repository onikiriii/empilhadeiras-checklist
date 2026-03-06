using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record CategoriaEquipamentoDto(
    Guid Id,
    string Nome,
    bool Ativa
);

public record CriarCategoriaEquipamentoRequest(
    [Required] string Nome,
    bool Ativa = true
);

public record AtualizarCategoriaEquipamentoRequest(
    [Required] string Nome,
    bool Ativa
);