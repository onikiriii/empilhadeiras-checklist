using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Models;

public class Checklist
{
    [Required]
    public Guid Id { get; set; }

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public Guid EquipamentoId { get; set; }
    public Equipamento Equipamento { get; set; } = null!;

    public Guid OperadorId { get; set; }
    public Operador Operador { get; set; } = null!;

    public DateTime DataRealizacao { get; set; } = DateTime.UtcNow;
    public DateTime DataReferencia { get; set; } = DateTime.UtcNow.Date;
    public bool Aprovado { get; set; }
    public string? ObservacoesGerais { get; set; }

    public string? AssinaturaOperadorBase64 { get; set; }
    public DateTime? AssinadoEm { get; set; }

    public ChecklistStatus Status { get; set; } = ChecklistStatus.Pendente;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<ChecklistItem> Itens { get; set; } = new();
}

public enum ChecklistStatus
{
    Pendente,
    Aprovado,
    Reprovado,
    EmManutencao,
    Concluido
}
