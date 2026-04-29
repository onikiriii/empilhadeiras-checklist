namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public record ItemNaoOkPainelDto(
    List<ItemNaoOkPainelItemDto> PendentesAprovacao,
    List<ItemNaoOkPainelItemDto> EmAndamento,
    List<ItemNaoOkPainelItemDto> Concluidas
);
