using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record EquipamentoDto(
    Guid Id,
    Guid SetorId,
    string Codigo,
    string Descricao,
    bool Ativa,
    Guid CategoriaId,
    string CategoriaNome,
    Guid QrId
);

public record CriarEquipamentoRequest(
    [Required] string Codigo,
    [Required] string Descricao,
    [Required] Guid CategoriaId,
    bool Ativa = true
);

public record AtualizarEquipamentoRequest(
    [Required] string Descricao,
    [Required] Guid CategoriaId,
    bool Ativa
);
