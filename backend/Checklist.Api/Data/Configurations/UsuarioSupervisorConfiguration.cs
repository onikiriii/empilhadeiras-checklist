using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class UsuarioSupervisorConfiguration : IEntityTypeConfiguration<UsuarioSupervisor>
{
    public void Configure(EntityTypeBuilder<UsuarioSupervisor> e)
    {
        e.Property(x => x.Nome).HasMaxLength(100).IsRequired();
        e.Property(x => x.Sobrenome).HasMaxLength(100).IsRequired();
        e.Property(x => x.Login).HasMaxLength(120).IsRequired();
        e.Property(x => x.Email).HasMaxLength(150);
        e.Property(x => x.Ramal).HasMaxLength(20);
        e.Property(x => x.SenhaHash).HasMaxLength(500).IsRequired();
        e.Property(x => x.TipoUsuario).HasConversion<int>();

        e.HasIndex(x => x.Login).IsUnique();
        e.HasIndex(x => x.Email).IsUnique();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
