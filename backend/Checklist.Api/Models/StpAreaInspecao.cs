namespace Checklist.Api.Models;

public class StpAreaInspecao
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SetorId { get; set; }
    public Setor Setor { get; set; } = null!;

    public string Nome { get; set; } = string.Empty;

    public Guid ResponsavelSupervisorId { get; set; }
    public UsuarioSupervisor ResponsavelSupervisor { get; set; } = null!;

    public bool Ativa { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
