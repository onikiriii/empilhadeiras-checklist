namespace Checklist.Api.Models;

public class CategoriaEquipamento
{
    public Guid Id { get; set; }

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public string Nome { get; set; } = "";
    public FechamentoMensalModelo ModeloFechamentoMensal { get; set; } = FechamentoMensalModelo.Nenhum;
    public bool Ativa { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<Equipamento> Equipamentos { get; set; } = new();
    public List<ChecklistItemTemplate> ChecklistItensTemplate { get; set; } = new();
}
