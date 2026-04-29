namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public record ItemNaoOkDto(
    Guid ChecklistId,
    Guid ChecklistItemId,
    DateTime DataRealizacao,
    string EquipamentoCodigo,
    string EquipamentoDescricao,
    string OperadorNome,
    string OperadorMatricula,
    int Ordem,
    string Descricao,
    string? Instrucao,
    string? Observacao,
    string? ImagemNokBase64,
    string? ImagemNokNomeArquivo,
    string? ImagemNokMimeType
);
