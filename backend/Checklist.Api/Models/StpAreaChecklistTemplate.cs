namespace Checklist.Api.Models;

public class StpAreaChecklistTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public string Codigo { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<StpAreaChecklistTemplateItem> Itens { get; set; } = new();
}
