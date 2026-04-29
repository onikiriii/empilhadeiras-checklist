namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public record ItemNaoOkHistoricoEntryDto(
    Guid Id,
    string Titulo,
    string Descricao,
    DateTime CriadoEm,
    string CriadoPorNomeCompleto
);
