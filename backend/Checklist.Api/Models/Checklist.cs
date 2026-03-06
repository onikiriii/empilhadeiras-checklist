namespace Checklist.Api.Models;

public class Checklist
{
    public Guid Id { get; set; }

    public Guid EquipamentoId { get; set; }
    public Equipamento Equipamento { get; set; } = null!;

    public Guid OperadorId { get; set; }
    public Operador Operador { get; set; } = null!;

    public DateTime DataRealizacao { get; set; } = DateTime.UtcNow;
    public bool Aprovado { get; set; }  // geral (todos os itens OK)
    public string? ObservacoesGerais { get; set; }

    public ChecklistStatus Status { get; set; } = ChecklistStatus.Pendente;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<ChecklistItem> Itens { get; set; } = new();
}

public enum ChecklistStatus
{
    Pendente,       // acabou de ser enviado
    Aprovado,       // todos os itens OK
    Reprovado,      // algum item NOK → vai para manutenção
    EmManutencao,   // equipe de manutenção está atuando
    Concluido       // manutenção finalizada
}