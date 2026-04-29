using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpDocumentoEmpresaArquivoConfiguration : IEntityTypeConfiguration<StpDocumentoEmpresaArquivo>
{
    public void Configure(EntityTypeBuilder<StpDocumentoEmpresaArquivo> e)
    {
        e.Property(x => x.Nome).HasMaxLength(180).IsRequired();
        e.Property(x => x.NomeArquivoOriginal).HasMaxLength(260).IsRequired();
        e.Property(x => x.MimeType).HasMaxLength(120).IsRequired();
        e.Property(x => x.Conteudo).HasColumnType("longblob").IsRequired();

        e.HasOne(x => x.Empresa)
            .WithMany(x => x.Documentos)
            .HasForeignKey(x => x.EmpresaId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.EnviadoPorSupervisor)
            .WithMany()
            .HasForeignKey(x => x.EnviadoPorSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
