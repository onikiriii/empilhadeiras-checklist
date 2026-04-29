namespace Checklist.Api.Controllers.Features.Supervisor.Dashboard;

public record SupervisorDashboardItemDto(
    Guid Id,
    Guid SetorId,
    string Codigo,
    string Descricao,
    string? CategoriaNome,
    string Status,
    Guid? ChecklistId,
    DateTime? CriadoEm
);
