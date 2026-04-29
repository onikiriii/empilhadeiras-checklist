namespace Checklist.Api.Models;

public class StpDocumentoFuncionario
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EmpresaId { get; set; }
    public StpDocumentoEmpresa Empresa { get; set; } = null!;

    public string Nome { get; set; } = string.Empty;
    public string? Cargo { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<StpDocumentoFuncionarioArquivo> Documentos { get; set; } = [];
}
