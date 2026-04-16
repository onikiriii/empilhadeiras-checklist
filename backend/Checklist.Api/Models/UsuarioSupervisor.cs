using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Models;

public class UsuarioSupervisor
{
    [Required]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Sobrenome { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Login { get; set; } = string.Empty;

    [MaxLength(150)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Ramal { get; set; }

    [Required]
    [MaxLength(500)]
    public string SenhaHash { get; set; } = string.Empty;

    public bool ForceChangePassword { get; set; } = true;
    public bool IsMaster { get; set; } = false;
    public UsuarioTipoAcesso TipoUsuario { get; set; } = UsuarioTipoAcesso.Supervisor;

    [Required]
    public Guid SetorId { get; set; }

    public Setor Setor { get; set; } = null!;
    public List<UsuarioSupervisorModulo> Modulos { get; set; } = [];

    public bool Ativo { get; set; } = true;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
