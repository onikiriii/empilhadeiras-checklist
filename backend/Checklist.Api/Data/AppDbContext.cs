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
    public DbSet<ChecklistItemAcaoHistorico> ChecklistItensAcoesHistorico { get; set; } = null!;
    public DbSet<StpAreaChecklistTemplate> StpAreaChecklistTemplates { get; set; } = null!;
    public DbSet<StpAreaChecklistTemplateItem> StpAreaChecklistTemplateItens { get; set; } = null!;
    public DbSet<StpAreaChecklist> StpAreaChecklists { get; set; } = null!;
    public DbSet<StpAreaChecklistItem> StpAreaChecklistItens { get; set; } = null!;
    public DbSet<Setor> Setores { get; set; } = null!;
    public DbSet<UsuarioSupervisor> UsuariosSupervisores { get; set; } = null!;
    public DbSet<UsuarioSupervisorModulo> UsuariosSupervisoresModulos { get; set; } = null!;
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
            e.Property(x => x.TipoUsuario).HasConversion<int>();

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
            e.Property(x => x.ImagemNokBase64).HasColumnType("longtext");
            e.Property(x => x.ImagemNokNomeArquivo).HasMaxLength(260);
            e.Property(x => x.ImagemNokMimeType).HasMaxLength(120);

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
            e.Property(x => x.ObservacaoResponsavel).HasMaxLength(2000);
            e.Property(x => x.PercentualConclusao).HasDefaultValue(0);
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

            e.HasMany(x => x.Historico)
                .WithOne(x => x.ChecklistItemAcao)
                .HasForeignKey(x => x.ChecklistItemAcaoId)
                .HasConstraintName("FK_CIAHistorico_Acao")
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChecklistItemAcaoHistorico>(e =>
        {
            e.Property(x => x.Titulo).HasMaxLength(160).IsRequired();
            e.Property(x => x.Descricao).HasMaxLength(4000).IsRequired();

            e.HasOne(x => x.CriadoPorSupervisor)
                .WithMany()
                .HasForeignKey(x => x.CriadoPorSupervisorId)
                .HasConstraintName("FK_CIAHistorico_Supervisor")
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StpAreaChecklistTemplate>(e =>
        {
            e.Property(x => x.Codigo).HasMaxLength(40).IsRequired();
            e.Property(x => x.Nome).HasMaxLength(160).IsRequired();

            e.HasIndex(x => new { x.SetorId, x.Codigo }).IsUnique();

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UsuarioSupervisorModulo>(e =>
        {
            e.Property(x => x.Modulo).HasConversion<int>();
            e.HasIndex(x => new { x.UsuarioSupervisorId, x.Modulo }).IsUnique();

            e.HasOne(x => x.UsuarioSupervisor)
                .WithMany(x => x.Modulos)
                .HasForeignKey(x => x.UsuarioSupervisorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StpAreaChecklistTemplateItem>(e =>
        {
            e.Property(x => x.Descricao).HasMaxLength(300).IsRequired();
            e.Property(x => x.Instrucao).HasMaxLength(2000);

            e.HasIndex(x => new { x.TemplateId, x.Ordem }).IsUnique();

            e.HasOne(x => x.Template)
                .WithMany(x => x.Itens)
                .HasForeignKey(x => x.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StpAreaChecklist>(e =>
        {
            e.Property(x => x.ResponsavelPresenteNome).HasMaxLength(160).IsRequired();
            e.Property(x => x.ResponsavelPresenteCargo).HasMaxLength(120);
            e.Property(x => x.ComportamentosPreventivosObservados).HasMaxLength(4000);
            e.Property(x => x.AtosInsegurosObservados).HasMaxLength(4000);
            e.Property(x => x.CondicoesInsegurasConstatadas).HasMaxLength(4000);
            e.Property(x => x.AssinaturaInspetorBase64).HasColumnType("longtext").IsRequired();
            e.Property(x => x.AssinaturaResponsavelPresenteBase64).HasColumnType("longtext").IsRequired();

            e.HasIndex(x => new { x.SetorId, x.DataReferencia });

            e.HasOne(x => x.Setor)
                .WithMany()
                .HasForeignKey(x => x.SetorId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Template)
                .WithMany()
                .HasForeignKey(x => x.TemplateId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.InspetorSupervisor)
                .WithMany()
                .HasForeignKey(x => x.InspetorSupervisorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StpAreaChecklistItem>(e =>
        {
            e.Property(x => x.Descricao).HasMaxLength(300).IsRequired();
            e.Property(x => x.Instrucao).HasMaxLength(2000);
            e.Property(x => x.Observacao).HasMaxLength(2000);

            e.HasIndex(x => new { x.ChecklistId, x.Ordem }).IsUnique();

            e.HasOne(x => x.Checklist)
                .WithMany(x => x.Itens)
                .HasForeignKey(x => x.ChecklistId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.TemplateItem)
                .WithMany()
                .HasForeignKey(x => x.TemplateItemId)
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
