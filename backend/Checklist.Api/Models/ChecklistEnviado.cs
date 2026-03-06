using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Models;

public class ChecklistEnviado
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EquipamentoId { get; set; }
    public Equipamento Equipamento { get; set; } = null!;
    public string OperadorNome { get; set; } = "";
    public string OperadorMatricula { get; set; } = "";
    public bool Aprovado { get; set; }
    public string? Observacoes { get; set; }
    public DateTime CriadoEm { get; set; }  // Mudou para DateTime
}