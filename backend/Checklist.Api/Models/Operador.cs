using System.ComponentModel.DataAnnotations;

namespace Checklist.Api.Models;

public class Operador
{
    [Required]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SetorId { get; set; }

    public Setor Setor { get; set; } = null!;

    [Required]
    [MaxLength(40)]
    public string Matricula { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(60)]
    public string Login { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string SenhaHash { get; set; } = string.Empty;

    public bool ForceChangePassword { get; set; } = true;

    public DateTime? UltimoLoginEm { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
