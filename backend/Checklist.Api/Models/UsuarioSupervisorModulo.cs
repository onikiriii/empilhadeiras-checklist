namespace Checklist.Api.Models;

public class UsuarioSupervisorModulo
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UsuarioSupervisorId { get; set; }
    public UsuarioSupervisor UsuarioSupervisor { get; set; } = null!;

    public ModuloAcesso Modulo { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
