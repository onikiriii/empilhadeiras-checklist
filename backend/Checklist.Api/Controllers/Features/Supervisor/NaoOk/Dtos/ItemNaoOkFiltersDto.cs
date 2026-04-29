namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public record ItemNaoOkFiltersDto(
    string? DataInicio,
    string? DataFim,
    string? Equipamento,
    string? Operador
);
