namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public record SupervisorResponsavelOptionDto(
    Guid Id,
    string NomeCompleto,
    string Login,
    Guid SetorId,
    string SetorNome
);
