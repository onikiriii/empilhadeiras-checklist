using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ChecklistModel = Checklist.Api.Models.Checklist;

namespace Checklist.Api.Data.Configurations;

public class ChecklistConfiguration : IEntityTypeConfiguration<ChecklistModel>
{
    public void Configure(EntityTypeBuilder<ChecklistModel> e)
    {
        e.Property(x => x.ObservacoesGerais).HasMaxLength(1000);
        e.Property(x => x.AssinaturaOperadorBase64);
        e.Property(x => x.AssinadoEm);

        e.HasIndex(x => new { x.SetorId, x.EquipamentoId, x.DataReferencia }).IsUnique();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.Equipamento)
            .WithMany()
            .HasForeignKey(x => x.EquipamentoId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(x => x.Operador)
            .WithMany()
            .HasForeignKey(x => x.OperadorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
