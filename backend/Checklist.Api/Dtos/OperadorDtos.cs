using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record OperadorDto(
    Guid Id,
    Guid SetorId,
    string Matricula,
    string Nome,
    string Login,
    bool ForceChangePassword,
    bool Ativo
);

public record CriarOperadorRequest(
    Guid? SetorId,
    [Required] string Matricula,
    [Required] string Nome,
    [Required] string Login,
    [Required] string Senha,
    [Required] string ConfirmaSenha,
    bool ForceChangePassword = true
);

public record AtualizarOperadorRequest(
    [Required] string Nome,
    [Required] string Login,
    bool Ativo,
    bool ForceChangePassword = true,
    string? Senha = null,
    string? ConfirmaSenha = null
);
