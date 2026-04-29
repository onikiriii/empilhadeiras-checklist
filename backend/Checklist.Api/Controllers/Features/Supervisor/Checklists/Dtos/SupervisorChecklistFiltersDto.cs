namespace Checklist.Api.Controllers.Features.Supervisor.Checklists;

public record SupervisorChecklistFiltersDto(
    string? DataInicio,
    string? DataFim,
    string? Status,
    string? Operador
);
