using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpAreaChecklistItemConfiguration : IEntityTypeConfiguration<StpAreaChecklistItem>
{
    public void Configure(EntityTypeBuilder<StpAreaChecklistItem> e)
    {
        e.Property(x => x.Descricao).HasMaxLength(300).IsRequired();
        e.Property(x => x.Instrucao).HasMaxLength(2000);
        e.Property(x => x.Observacao).HasMaxLength(2000);

        e.HasIndex(x => new { x.ChecklistId, x.Ordem }).IsUnique();

        e.HasOne(x => x.Checklist)
            .WithMany(x => x.Itens)
            .HasForeignKey(x => x.ChecklistId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.TemplateItem)
            .WithMany()
            .HasForeignKey(x => x.TemplateItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
