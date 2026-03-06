using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record OperadorDto(
    Guid Id,
    string Matricula,
    string Nome,
    bool Ativo
);

public record CriarOperadorRequest(
    [Required] string Matricula,
    [Required] string Nome
);

public record AtualizarOperadorRequest(
    [Required] string Nome,
    bool Ativo
);