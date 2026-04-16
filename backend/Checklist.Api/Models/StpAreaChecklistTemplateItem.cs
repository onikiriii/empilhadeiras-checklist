namespace Checklist.Api.Models;

public class StpAreaChecklistTemplateItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TemplateId { get; set; }
    public StpAreaChecklistTemplate Template { get; set; } = null!;

    public int Ordem { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string? Instrucao { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
