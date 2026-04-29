using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpDocumentoEmpresaConfiguration : IEntityTypeConfiguration<StpDocumentoEmpresa>
{
    public void Configure(EntityTypeBuilder<StpDocumentoEmpresa> e)
    {
        e.Property(x => x.Nome).HasMaxLength(180).IsRequired();
        e.HasIndex(x => new { x.SetorId, x.Nome }).IsUnique();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
