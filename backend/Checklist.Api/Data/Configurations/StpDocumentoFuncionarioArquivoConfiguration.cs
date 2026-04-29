using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Checklist.Api.Data.Configurations;

public class StpDocumentoFuncionarioArquivoConfiguration : IEntityTypeConfiguration<StpDocumentoFuncionarioArquivo>
{
    public void Configure(EntityTypeBuilder<StpDocumentoFuncionarioArquivo> e)
    {
        e.Property(x => x.Nome).HasMaxLength(180).IsRequired();
        e.Property(x => x.NomeArquivoOriginal).HasMaxLength(260).IsRequired();
        e.Property(x => x.MimeType).HasMaxLength(120).IsRequired();
        e.Property(x => x.Conteudo).HasColumnType("longblob").IsRequired();

        e.HasOne(x => x.Funcionario)
            .WithMany(x => x.Documentos)
            .HasForeignKey(x => x.FuncionarioId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.EnviadoPorSupervisor)
            .WithMany()
            .HasForeignKey(x => x.EnviadoPorSupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
