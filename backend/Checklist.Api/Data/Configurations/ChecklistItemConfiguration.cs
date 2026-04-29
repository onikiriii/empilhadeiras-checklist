using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class ChecklistItemConfiguration : IEntityTypeConfiguration<ChecklistItem>
{
    public void Configure(EntityTypeBuilder<ChecklistItem> e)
    {
        e.Property(x => x.Descricao).HasMaxLength(200).IsRequired();
        e.Property(x => x.Instrucao).HasMaxLength(500);
        e.Property(x => x.Observacao).HasMaxLength(500);
        e.Property(x => x.ImagemNokBase64).HasColumnType("longtext");
        e.Property(x => x.ImagemNokNomeArquivo).HasMaxLength(260);
        e.Property(x => x.ImagemNokMimeType).HasMaxLength(120);

        e.HasOne(x => x.Checklist)
            .WithMany(c => c.Itens)
            .HasForeignKey(x => x.ChecklistId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.Template)
            .WithMany()
            .HasForeignKey(x => x.TemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
