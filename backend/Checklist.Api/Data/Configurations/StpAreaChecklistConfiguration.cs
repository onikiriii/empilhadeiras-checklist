using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpAreaChecklistConfiguration : IEntityTypeConfiguration<StpAreaChecklist>
{
    public void Configure(EntityTypeBuilder<StpAreaChecklist> e)
    {
        e.Property(x => x.ResponsavelPresenteNome).HasMaxLength(160).IsRequired();
        e.Property(x => x.ResponsavelPresenteCargo).HasMaxLength(120);
        e.Property(x => x.ComportamentosPreventivosObservados).HasMaxLength(4000);
        e.Property(x => x.AtosInsegurosObservados).HasMaxLength(4000);
        e.Property(x => x.CondicoesInsegurasConstatadas).HasMaxLength(4000);
        e.Property(x => x.AssinaturaInspetorBase64).HasColumnType("longtext").IsRequired();
        e.Property(x => x.AssinaturaResponsavelPresenteBase64).HasColumnType("longtext").IsRequired();

        e.HasIndex(x => new { x.SetorId, x.DataReferencia });

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.SetorInspecionado)
            .WithMany()
            .HasForeignKey(x => x.SetorInspecionadoId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.AreaInspecao)
            .WithMany()
            .HasForeignKey(x => x.AreaInspecaoId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.Template)
            .WithMany()
            .HasForeignKey(x => x.TemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.InspetorSupervisor)
            .WithMany()
            .HasForeignKey(x => x.InspetorSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
