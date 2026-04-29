using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class ChecklistItemAcaoConfiguration : IEntityTypeConfiguration<ChecklistItemAcao>
{
    public void Configure(EntityTypeBuilder<ChecklistItemAcao> e)
    {
        e.Property(x => x.ObservacaoAtribuicao).HasMaxLength(1000);
        e.Property(x => x.ObservacaoResponsavel).HasMaxLength(2000);
        e.Property(x => x.PercentualConclusao).HasDefaultValue(0);
        e.Property(x => x.Status).HasConversion<int>();

        e.HasIndex(x => x.ChecklistItemId).IsUnique();

        e.HasOne(x => x.ChecklistItem)
            .WithOne(x => x.Acao)
            .HasForeignKey<ChecklistItemAcao>(x => x.ChecklistItemId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.AprovadoPorSupervisor)
            .WithMany()
            .HasForeignKey(x => x.AprovadoPorSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.ResponsavelSupervisor)
            .WithMany()
            .HasForeignKey(x => x.ResponsavelSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.ResponsavelSetor)
            .WithMany()
            .HasForeignKey(x => x.ResponsavelSetorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.ConcluidoPorSupervisor)
            .WithMany()
            .HasForeignKey(x => x.ConcluidoPorSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasMany(x => x.Historico)
            .WithOne(x => x.ChecklistItemAcao)
            .HasForeignKey(x => x.ChecklistItemAcaoId)
            .HasConstraintName("FK_CIAHistorico_Acao")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
