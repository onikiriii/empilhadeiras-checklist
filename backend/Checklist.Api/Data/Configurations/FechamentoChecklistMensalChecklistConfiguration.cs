using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class FechamentoChecklistMensalChecklistConfiguration : IEntityTypeConfiguration<FechamentoChecklistMensalChecklist>
{
    public void Configure(EntityTypeBuilder<FechamentoChecklistMensalChecklist> e)
    {
        e.HasIndex(x => new { x.FechamentoChecklistMensalId, x.ChecklistId }).IsUnique();

        e.HasOne(x => x.FechamentoChecklistMensal)
            .WithMany(x => x.Checklists)
            .HasForeignKey(x => x.FechamentoChecklistMensalId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.Checklist)
            .WithMany()
            .HasForeignKey(x => x.ChecklistId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
