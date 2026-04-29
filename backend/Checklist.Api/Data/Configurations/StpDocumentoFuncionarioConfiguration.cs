using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpDocumentoFuncionarioConfiguration : IEntityTypeConfiguration<StpDocumentoFuncionario>
{
    public void Configure(EntityTypeBuilder<StpDocumentoFuncionario> e)
    {
        e.Property(x => x.Nome).HasMaxLength(180).IsRequired();
        e.Property(x => x.Cargo).HasMaxLength(160);
        e.HasIndex(x => new { x.EmpresaId, x.Nome }).IsUnique();

        e.HasOne(x => x.Empresa)
            .WithMany(x => x.Funcionarios)
            .HasForeignKey(x => x.EmpresaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
