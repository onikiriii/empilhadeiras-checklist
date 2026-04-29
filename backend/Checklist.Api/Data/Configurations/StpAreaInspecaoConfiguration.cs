using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpAreaInspecaoConfiguration : IEntityTypeConfiguration<StpAreaInspecao>
{
    public void Configure(EntityTypeBuilder<StpAreaInspecao> e)
    {
        e.Property(x => x.Nome).HasMaxLength(160).IsRequired();
        e.HasIndex(x => new { x.SetorId, x.Nome }).IsUnique();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.ResponsavelSupervisor)
            .WithMany()
            .HasForeignKey(x => x.ResponsavelSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
