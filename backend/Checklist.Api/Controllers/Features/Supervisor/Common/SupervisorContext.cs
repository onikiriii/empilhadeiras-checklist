namespace Checklist.Api.Controllers.Features.Supervisor.Common;

public record SupervisorContext(
    Guid SupervisorId,
    Guid SetorId
);
