using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class ChecklistItemTemplateConfiguration : IEntityTypeConfiguration<ChecklistItemTemplate>
{
    public void Configure(EntityTypeBuilder<ChecklistItemTemplate> e)
    {
        e.Property(x => x.Descricao).HasMaxLength(200).IsRequired();
        e.Property(x => x.Instrucao).HasMaxLength(500);

        e.HasIndex(x => new { x.CategoriaId, x.Ordem });

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.Categoria)
            .WithMany(c => c.ChecklistItensTemplate)
            .HasForeignKey(x => x.CategoriaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
