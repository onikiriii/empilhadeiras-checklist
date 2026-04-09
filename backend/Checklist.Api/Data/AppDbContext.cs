using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;
using ChecklistModel = Checklist.Api.Models.Checklist;

namespace Checklist.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Equipamento> Equipamentos { get; set; } = null!;
    public DbSet<ChecklistEnviado> ChecklistsEnviados { get; set; } = null!;
    public DbSet<Operador> Operadores { get; set; } = null!;
    public DbSet<CategoriaEquipamento> CategoriasEquipamento { get; set; } = null!;
    public DbSet<ChecklistItemTemplate> ChecklistItensTemplate { get; set; } = null!;
    public DbSet<ChecklistModel> Checklists { get; set; } = null!;
    public DbSet<ChecklistItem> ChecklistItens { get; set; } = null!;
    public DbSet<ChecklistItemAcao> ChecklistItensAcoes { get; set; } = null!;
    public DbSet<Setor> Setores { get; set; } = null!;
    public DbSet<UsuarioSupervisor> UsuariosSupervisores { get; set; } = null!;
    public DbSet<FechamentoChecklistMensal> FechamentosChecklistMensais { get; set; } = null!;
    public DbSet<FechamentoChecklistMensalChecklist> FechamentosChecklistMensaisChecklists { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Setor>(e =>
        {
            e.Property(x => x.Nome).HasMaxLength(100).IsRequired();
            e.Property(x => x.Descricao).HasMaxLength(300);
            e.HasIndex(x => x.Nome).IsUnique();
        });

        modelBuilder.Entity<UsuarioSupervisor>(e =>
        {
            e.Property(x => x.Nome).HasMaxLength(100).IsRequired();
            e.Property(x => x.Sobrenome).HasMaxLength(100).IsRequired();
            e.Property(x => x.Login).HasMaxLength(120).IsRequired();
            e.Property(x => x.Email).HasMaxLength(150);
            e.Property(x => x.Ramal).HasMaxLength(20);
            e.Property(x => x.SenhaHash).HasMaxLength(500).IsRequired();

            e.HasIndex(x => x.Login).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Operador>(e =>
        {
            e.HasIndex(x => x.Matricula).IsUnique();
            e.Property(x => x.Matricula).HasMaxLength(20).IsRequired();
            e.Property(x => x.Nome).HasMaxLength(100).IsRequired();

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CategoriaEquipamento>(e =>
        {
            e.Property(x => x.Nome).HasMaxLength(80).IsRequired();
            e.Property(x => x.ModeloFechamentoMensal).HasConversion<int>();
            e.HasIndex(x => new { x.SetorId, x.Nome }).IsUnique();

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Equipamento>(e =>
        {
            e.HasIndex(x => x.QrId).IsUnique();

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Categoria)
                .WithMany(c => c.Equipamentos)
                .HasForeignKey(x => x.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChecklistItemTemplate>(e =>
        {
            e.Property(x => x.Descricao).HasMaxLength(200).IsRequired();
            e.Property(x => x.Instrucao).HasMaxLength(500);

            e.HasIndex(x => new { x.CategoriaId, x.Ordem });

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Categoria)
                .WithMany(c => c.ChecklistItensTemplate)
                .HasForeignKey(x => x.CategoriaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChecklistModel>(e =>
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
        });

        modelBuilder.Entity<ChecklistItem>(e =>
        {
            e.Property(x => x.Descricao).HasMaxLength(200).IsRequired();
            e.Property(x => x.Instrucao).HasMaxLength(500);
            e.Property(x => x.Observacao).HasMaxLength(500);

            e.HasOne(x => x.Checklist)
                .WithMany(c => c.Itens)
                .HasForeignKey(x => x.ChecklistId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Template)
                .WithMany()
                .HasForeignKey(x => x.TemplateId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChecklistItemAcao>(e =>
        {
            e.Property(x => x.ObservacaoAtribuicao).HasMaxLength(1000);
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
        });

        modelBuilder.Entity<FechamentoChecklistMensal>(e =>
        {
            e.Property(x => x.TemplateNome).HasMaxLength(120).IsRequired();
            e.Property(x => x.TemplateVersao).HasMaxLength(40).IsRequired();
            e.Property(x => x.NomeArquivoPdf).HasMaxLength(180).IsRequired();
            e.Property(x => x.HashPdfSha256).HasMaxLength(128).IsRequired();
            e.Property(x => x.SnapshotJson).HasColumnType("longtext").IsRequired();
            e.Property(x => x.PdfConteudo).HasColumnType("longblob").IsRequired();

            e.HasIndex(x => new { x.SetorId, x.EquipamentoId, x.Ano, x.Mes }).IsUnique();

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Equipamento)
                .WithMany()
                .HasForeignKey(x => x.EquipamentoId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.FechadoPorSupervisor)
                .WithMany()
                .HasForeignKey(x => x.FechadoPorSupervisorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FechamentoChecklistMensalChecklist>(e =>
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
        });
    }
}
