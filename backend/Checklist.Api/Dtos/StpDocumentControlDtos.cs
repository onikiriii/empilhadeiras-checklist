using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Dtos;

public record StpDocumentoEmpresaSummaryDto(
    Guid Id,
    Guid SetorId,
    string Nome,
    bool Ativa,
    int TotalDocumentos,
    int TotalFuncionarios
);

public record StpDocumentoEmpresaRequest(
    [Required] string Nome,
    bool Ativa = true
);

public record StpDocumentoFuncionarioSummaryDto(
    Guid Id,
    Guid EmpresaId,
    string Nome,
    string? Cargo,
    bool Ativo,
    int TotalDocumentos
);

public record StpDocumentoFuncionarioRequest(
    [Required] string Nome,
    string? Cargo,
    bool Ativo = true
);

public record StpDocumentoArquivoDto(
    Guid Id,
    string Nome,
    string NomeArquivoOriginal,
    string MimeType,
    long TamanhoBytes,
    DateTime CriadoEm
);
