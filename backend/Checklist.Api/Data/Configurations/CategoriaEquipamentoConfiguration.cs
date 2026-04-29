using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class CategoriaEquipamentoConfiguration : IEntityTypeConfiguration<CategoriaEquipamento>
{
    public void Configure(EntityTypeBuilder<CategoriaEquipamento> e)
    {
        e.Property(x => x.Nome).HasMaxLength(80).IsRequired();
        e.Property(x => x.ModeloFechamentoMensal).HasConversion<int>();
        e.HasIndex(x => new { x.SetorId, x.Nome }).IsUnique();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
