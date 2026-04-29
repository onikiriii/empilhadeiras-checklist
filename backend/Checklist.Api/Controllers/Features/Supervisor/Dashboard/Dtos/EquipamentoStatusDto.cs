namespace Checklist.Api.Controllers.Features.Supervisor.Dashboard;

public record EquipamentoStatusDto(
    string Codigo,
    string Descricao,
    bool TemChecklistHoje
);
