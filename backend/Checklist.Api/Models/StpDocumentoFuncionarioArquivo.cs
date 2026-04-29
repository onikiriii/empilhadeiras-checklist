namespace Checklist.Api.Models;

public class StpDocumentoFuncionarioArquivo
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid FuncionarioId { get; set; }
    public StpDocumentoFuncionario Funcionario { get; set; } = null!;

    public string Nome { get; set; } = string.Empty;
    public string NomeArquivoOriginal { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/octet-stream";
    public long TamanhoBytes { get; set; }
    public byte[] Conteudo { get; set; } = [];

    public Guid EnviadoPorSupervisorId { get; set; }
    public UsuarioSupervisor EnviadoPorSupervisor { get; set; } = null!;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
