namespace Checklist.Api.Models;

public class ChecklistItemAcao
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChecklistItemId { get; set; }
    public ChecklistItem ChecklistItem { get; set; } = null!;

    public ItemNaoOkAcaoStatus Status { get; set; } = ItemNaoOkAcaoStatus.EmAndamento;

    public Guid AprovadoPorSupervisorId { get; set; }
    public UsuarioSupervisor AprovadoPorSupervisor { get; set; } = null!;
    public DateTime AprovadoEm { get; set; } = DateTime.UtcNow;

    public Guid? ResponsavelSupervisorId { get; set; }
    public UsuarioSupervisor? ResponsavelSupervisor { get; set; }

    public Guid? ResponsavelSetorId { get; set; }
    public Setor? ResponsavelSetor { get; set; }

    public string? ObservacaoAtribuicao { get; set; }
    public string? ObservacaoResponsavel { get; set; }
    public DateTime? DataPrevistaConclusao { get; set; }
    public int PercentualConclusao { get; set; }

    public Guid? ConcluidoPorSupervisorId { get; set; }
    public UsuarioSupervisor? ConcluidoPorSupervisor { get; set; }
    public DateTime? ConcluidoEm { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<ChecklistItemAcaoHistorico> Historico { get; set; } = [];
}

public class ChecklistItemAcaoHistorico
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChecklistItemAcaoId { get; set; }
    public ChecklistItemAcao ChecklistItemAcao { get; set; } = null!;

    public Guid CriadoPorSupervisorId { get; set; }
    public UsuarioSupervisor CriadoPorSupervisor { get; set; } = null!;

    public string Titulo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

public enum ItemNaoOkAcaoStatus
{
    EmAndamento,
    Concluida
}
