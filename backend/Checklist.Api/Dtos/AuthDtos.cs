using Checklist.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record LoginSupervisorRequest(
    [Required] string Login,
    [Required] string Senha
);

public record DefinirNovaSenhaRequest(
    [Required] string NovaSenha,
    [Required] string ConfirmacaoSenha
);

public record SupervisorAuthDto(
    Guid Id,
    string Nome,
    string Sobrenome,
    string NomeCompleto,
    string Login,
    string? Email,
    string? Ramal,
    Guid SetorId,
    string SetorNome,
    bool ForceChangePassword,
    bool IsMaster,
    UsuarioTipoAcesso TipoUsuario,
    IReadOnlyList<string> ModulosDisponiveis
);

public record LoginSupervisorResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    SupervisorAuthDto Supervisor
);
