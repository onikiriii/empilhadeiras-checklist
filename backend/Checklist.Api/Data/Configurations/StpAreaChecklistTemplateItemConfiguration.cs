using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpAreaChecklistTemplateItemConfiguration : IEntityTypeConfiguration<StpAreaChecklistTemplateItem>
{
    public void Configure(EntityTypeBuilder<StpAreaChecklistTemplateItem> e)
    {
        e.Property(x => x.Descricao).HasMaxLength(300).IsRequired();
        e.Property(x => x.Instrucao).HasMaxLength(2000);

        e.HasIndex(x => new { x.TemplateId, x.Ordem }).IsUnique();

        e.HasOne(x => x.Template)
            .WithMany(x => x.Itens)
            .HasForeignKey(x => x.TemplateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
