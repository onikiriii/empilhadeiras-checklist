using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpAreaChecklistTemplateConfiguration : IEntityTypeConfiguration<StpAreaChecklistTemplate>
{
    public void Configure(EntityTypeBuilder<StpAreaChecklistTemplate> e)
    {
        e.Property(x => x.Codigo).HasMaxLength(40).IsRequired();
        e.Property(x => x.Nome).HasMaxLength(160).IsRequired();

        e.HasIndex(x => new { x.SetorId, x.Codigo }).IsUnique();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
