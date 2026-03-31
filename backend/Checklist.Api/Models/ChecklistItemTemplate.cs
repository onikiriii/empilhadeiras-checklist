namespace Checklist.Api.Models;

public class ChecklistItemTemplate
{
    public Guid Id { get; set; }

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public Guid CategoriaId { get; set; }
    public CategoriaEquipamento Categoria { get; set; } = null!;

    public int Ordem { get; set; }
    public string Descricao { get; set; } = "";
    public string? Instrucao { get; set; }

    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
