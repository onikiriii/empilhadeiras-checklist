namespace Checklist.Api.Controllers.Features.Supervisor.Checklists;

public record SupervisorChecklistListItemDto(
    Guid Id,
    Guid SetorId,
    string EquipamentoCodigo,
    string EquipamentoDescricao,
    string OperadorNome,
    string OperadorMatricula,
    DateTime CriadoEm,
    string Status,
    int TotalItens,
    int ItensOk,
    int ItensNok
);
