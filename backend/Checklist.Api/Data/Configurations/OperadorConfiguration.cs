using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class OperadorConfiguration : IEntityTypeConfiguration<Operador>
{
    public void Configure(EntityTypeBuilder<Operador> e)
    {
        e.HasIndex(x => x.Matricula).IsUnique();
        e.HasIndex(x => x.Login).IsUnique();
        e.Property(x => x.Matricula).HasMaxLength(40).IsRequired();
        e.Property(x => x.Nome).HasMaxLength(120).IsRequired();
        e.Property(x => x.Login).HasMaxLength(60).IsRequired();
        e.Property(x => x.SenhaHash).HasMaxLength(500).IsRequired();

        e.HasOne(x => x.Setor)
            .WithMany()
            .HasForeignKey(x => x.SetorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
