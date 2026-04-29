namespace Checklist.Api.Models;

public class StpDocumentoEmpresa
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public string Nome { get; set; } = string.Empty;
    public bool Ativa { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<StpDocumentoEmpresaArquivo> Documentos { get; set; } = [];
    public List<StpDocumentoFuncionario> Funcionarios { get; set; } = [];
}
