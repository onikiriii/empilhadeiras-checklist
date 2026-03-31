using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record OperadorDto(
    Guid Id,
    Guid SetorId,
    string Matricula,
    string Nome,
    bool Ativo
);

public record CriarOperadorRequest(
    Guid? SetorId,
    [Required] string Matricula,
    [Required] string Nome
);

public record AtualizarOperadorRequest(
    [Required] string Nome,
    bool Ativo
);
