namespace Checklist.Api.Models;

public class ChecklistItem
{
    public Guid Id { get; set; }

    public Guid ChecklistId { get; set; }
    public Checklist Checklist { get; set; } = null!;

    public Guid TemplateId { get; set; }  // referência ao template
    public ChecklistItemTemplate Template { get; set; } = null!;

    public int Ordem { get; set; }
    public string Descricao { get; set; } = "";
    public string? Instrucao { get; set; }

    public ItemStatus Status { get; set; } = ItemStatus.NaoVerificado;
    public string? Observacao { get; set; }  // opcional do operador

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public ChecklistItemAcao? Acao { get; set; }
}

public enum ItemStatus
{
    NaoVerificado,
    OK,
    NOK,
    NA
}
