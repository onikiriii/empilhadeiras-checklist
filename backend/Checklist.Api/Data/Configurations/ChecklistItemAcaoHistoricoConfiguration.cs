using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class ChecklistItemAcaoHistoricoConfiguration : IEntityTypeConfiguration<ChecklistItemAcaoHistorico>
{
    public void Configure(EntityTypeBuilder<ChecklistItemAcaoHistorico> e)
    {
        e.Property(x => x.Titulo).HasMaxLength(160).IsRequired();
        e.Property(x => x.Descricao).HasMaxLength(4000).IsRequired();

        e.HasOne(x => x.CriadoPorSupervisor)
            .WithMany()
            .HasForeignKey(x => x.CriadoPorSupervisorId)
            .HasConstraintName("FK_CIAHistorico_Supervisor")
            .OnDelete(DeleteBehavior.Restrict);
    }
}
