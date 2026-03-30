namespace Checklist.Api.Models;

public class Operador
{
    public Guid Id { get; set; }

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public string Matricula { get; set; } = ""; // único
    public string Nome { get; set; } = "";

    public bool Ativo { get; set; } = true;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
