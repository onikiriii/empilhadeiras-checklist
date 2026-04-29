namespace Checklist.Api.Models;

public class StpAreaChecklist
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public Guid SetorInspecionadoId { get; set; }
    public Setor SetorInspecionado { get; set; } = null!;

    public Guid? AreaInspecaoId { get; set; }
    public StpAreaInspecao? AreaInspecao { get; set; }

    public Guid TemplateId { get; set; }
    public StpAreaChecklistTemplate Template { get; set; } = null!;

    public Guid InspetorSupervisorId { get; set; }
    public UsuarioSupervisor InspetorSupervisor { get; set; } = null!;

    public string ResponsavelPresenteNome { get; set; } = string.Empty;
    public string? ResponsavelPresenteCargo { get; set; }

    public string? ComportamentosPreventivosObservados { get; set; }
    public string? AtosInsegurosObservados { get; set; }
    public string? CondicoesInsegurasConstatadas { get; set; }

    public string AssinaturaInspetorBase64 { get; set; } = string.Empty;
    public string AssinaturaResponsavelPresenteBase64 { get; set; } = string.Empty;
    public DateTime AssinadoInspetorEm { get; set; } = DateTime.UtcNow;
    public DateTime AssinadoResponsavelPresenteEm { get; set; } = DateTime.UtcNow;

    public DateTime DataRealizacao { get; set; } = DateTime.UtcNow;
    public DateTime DataReferencia { get; set; } = DateTime.UtcNow.Date;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public List<StpAreaChecklistItem> Itens { get; set; } = new();
}
