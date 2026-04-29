using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class SetorConfiguration : IEntityTypeConfiguration<Setor>
{
    public void Configure(EntityTypeBuilder<Setor> e)
    {
        e.Property(x => x.Nome).HasMaxLength(100).IsRequired();
        e.Property(x => x.Descricao).HasMaxLength(300);
        e.HasIndex(x => x.Nome).IsUnique();
    }
}
