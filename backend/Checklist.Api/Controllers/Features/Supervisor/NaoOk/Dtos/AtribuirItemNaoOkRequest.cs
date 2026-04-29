using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public record AtribuirItemNaoOkRequest(
    [Required] Guid ResponsavelSupervisorId,
    string? ObservacaoAtribuicao,
    string? ObservacaoResponsavel,
    DateTime? DataPrevistaConclusao,
    [Range(0, 100)] int PercentualConclusao
);
