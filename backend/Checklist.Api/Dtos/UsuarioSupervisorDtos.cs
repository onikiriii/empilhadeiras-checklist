using Checklist.Api.Models;
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
    string SetorNome,
    UsuarioTipoAcesso TipoUsuario,
    IReadOnlyList<string> ModulosDisponiveis
);

public record CriarSupervisorRequest(
    [Required] string Nome,
    [Required] string Sobrenome,
    [Required] string Senha,
    [Required] string ConfirmaSenha,
    [Required] Guid SetorId,
    bool ForceChange = true,
    string? Ramal = null,
    string? Email = null
);

public record AtualizarSupervisorRequest(
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

public record CriarInspetorRequest(
    [Required] string Nome,
    [Required] string Sobrenome,
    [Required] string Senha,
    [Required] string ConfirmaSenha,
    [Required] Guid SetorId,
    bool ForceChange = true,
    [Required] IReadOnlyList<string> ModulosDisponiveis = null!,
    string? Ramal = null,
    string? Email = null
);

public record AtualizarInspetorRequest(
    [Required] string Nome,
    [Required] string Sobrenome,
    [Required] Guid SetorId,
    bool ForceChange = true,
    bool Ativo = true,
    [Required] IReadOnlyList<string> ModulosDisponiveis = null!,
    string? Ramal = null,
    string? Email = null,
    string? Senha = null,
    string? ConfirmaSenha = null
);
