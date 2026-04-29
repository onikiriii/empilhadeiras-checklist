using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class UsuarioSupervisorModuloConfiguration : IEntityTypeConfiguration<UsuarioSupervisorModulo>
{
    public void Configure(EntityTypeBuilder<UsuarioSupervisorModulo> e)
    {
        e.Property(x => x.Modulo).HasConversion<int>();
        e.HasIndex(x => new { x.UsuarioSupervisorId, x.Modulo }).IsUnique();

        e.HasOne(x => x.UsuarioSupervisor)
            .WithMany(x => x.Modulos)
            .HasForeignKey(x => x.UsuarioSupervisorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
