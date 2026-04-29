using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public record AtualizarTratativaItemNaoOkRequest(
    [Required] Guid ResponsavelSupervisorId,
    string? ObservacaoResponsavel,
    DateTime? DataPrevistaConclusao,
    [Range(0, 100)] int PercentualConclusao
);
