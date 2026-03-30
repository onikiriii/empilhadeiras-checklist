using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record UsuarioSupervisorDto(
    Guid Id,
    string Nome,
    string Sobrenome,
    string NomeCompleto,
    string Login,
    string? Ramal,
    string? Email,
    bool ForceChangePassword,
    bool IsMaster,
    bool Ativo,
    Guid SetorId,
    string SetorNome
);

public record CriarUsuarioSupervisorRequest(
    [Required] string Nome,
    [Required] string Sobrenome,
    [Required] string Senha,
    [Required] string ConfirmaSenha,
    [Required] Guid SetorId,
    bool ForceChange = true,
    string? Ramal = null,
    string? Email = null
);

public record AtualizarUsuarioSupervisorRequest(
    [Required] string Nome,
    [Required] string Sobrenome,
    [Required] Guid SetorId,
    bool ForceChange = true,
    bool Ativo = true,
    string? Ramal = null,
    string? Email = null,
    string? Senha = null,
    string? ConfirmaSenha = null
);
