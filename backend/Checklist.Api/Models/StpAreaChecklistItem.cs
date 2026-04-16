namespace Checklist.Api.Models;

public class StpAreaChecklistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChecklistId { get; set; }
    public StpAreaChecklist Checklist { get; set; } = null!;

    public Guid TemplateItemId { get; set; }
    public StpAreaChecklistTemplateItem TemplateItem { get; set; } = null!;

    public int Ordem { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string? Instrucao { get; set; }
    public StpAreaChecklistResultado Resultado { get; set; } = StpAreaChecklistResultado.Check;
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

public enum StpAreaChecklistResultado
{
    Check,
    X
}
