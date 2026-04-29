using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record OperadorLoginRequest(
    [Required] string Login,
    [Required] string Senha
);

public record DefinirNovaSenhaOperadorRequest(
    [Required] string NovaSenha,
    [Required] string ConfirmacaoSenha
);

public record OperadorAuthDto(
    Guid Id,
    string Nome,
    string Matricula,
    Guid SetorId,
    string SetorNome,
    bool ForceChangePassword
);

public record OperadorLoginResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    OperadorAuthDto Operador
);
