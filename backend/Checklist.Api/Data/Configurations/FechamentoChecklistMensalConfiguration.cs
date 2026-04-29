using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class FechamentoChecklistMensalConfiguration : IEntityTypeConfiguration<FechamentoChecklistMensal>
{
    public void Configure(EntityTypeBuilder<FechamentoChecklistMensal> e)
    {
        e.Property(x => x.TemplateNome).HasMaxLength(120).IsRequired();
        e.Property(x => x.TemplateVersao).HasMaxLength(40).IsRequired();
        e.Property(x => x.NomeArquivoPdf).HasMaxLength(180).IsRequired();
        e.Property(x => x.HashPdfSha256).HasMaxLength(128).IsRequired();
        e.Property(x => x.SnapshotJson).HasColumnType("longtext").IsRequired();
        e.Property(x => x.PdfConteudo).HasColumnType("longblob").IsRequired();

        e.HasIndex(x => new { x.SetorId, x.EquipamentoId, x.Ano, x.Mes }).IsUnique();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.Equipamento)
            .WithMany()
            .HasForeignKey(x => x.EquipamentoId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.FechadoPorSupervisor)
            .WithMany()
            .HasForeignKey(x => x.FechadoPorSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
