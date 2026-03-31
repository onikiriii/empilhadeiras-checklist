using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Models;

public class FechamentoChecklistMensal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    [Required]
    public Guid EquipamentoId { get; set; }
    public Equipamento Equipamento { get; set; } = null!;

    [Required]
    public Guid FechadoPorSupervisorId { get; set; }
    public UsuarioSupervisor FechadoPorSupervisor { get; set; } = null!;

    public int Ano { get; set; }
    public int Mes { get; set; }

    [Required]
    [MaxLength(120)]
    public string TemplateNome { get; set; } = "Checklist - Empilhadeiras";

    [Required]
    [MaxLength(40)]
    public string TemplateVersao { get; set; } = "v1";

    public FechamentoChecklistMensalStatus Status { get; set; } = FechamentoChecklistMensalStatus.Fechado;

    [Required]
    public string SnapshotJson { get; set; } = string.Empty;

    [Required]
    [MaxLength(180)]
    public string NomeArquivoPdf { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string HashPdfSha256 { get; set; } = string.Empty;

    [Required]
    public byte[] PdfConteudo { get; set; } = [];

    public int QuantidadeChecklists { get; set; }

    public DateTime FechadoEm { get; set; } = DateTime.UtcNow;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<FechamentoChecklistMensalChecklist> Checklists { get; set; } = [];
}

public class FechamentoChecklistMensalChecklist
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid FechamentoChecklistMensalId { get; set; }
    public FechamentoChecklistMensal FechamentoChecklistMensal { get; set; } = null!;

    public Guid ChecklistId { get; set; }
    public Checklist Checklist { get; set; } = null!;
}

public enum FechamentoChecklistMensalStatus
{
    Fechado = 1
}
