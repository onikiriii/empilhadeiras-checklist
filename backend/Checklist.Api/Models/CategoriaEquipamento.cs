namespace Checklist.Api.Models;

public class CategoriaEquipamento
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = "";
    public bool Ativa { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<Equipamento> Equipamentos { get; set; } = new();
    public List<ChecklistItemTemplate> ChecklistItensTemplate { get; set; } = new();
}