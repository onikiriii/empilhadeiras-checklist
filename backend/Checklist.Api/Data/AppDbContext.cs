using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Equipamento> Equipamentos { get; set; } = null!;
    public DbSet<ChecklistEnviado> ChecklistsEnviados { get; set; } = null!;
    public DbSet<Operador> Operadores { get; set; } = null!;
    public DbSet<CategoriaEquipamento> CategoriasEquipamento { get; set; } = null!;
    public DbSet<ChecklistItemTemplate> ChecklistItensTemplate { get; set; } = null!;
    public DbSet<Models.Checklist> Checklists { get; set; } = null!;
    public DbSet<ChecklistItem> ChecklistItens { get; set; } = null!;
    public DbSet<Setor> Setores { get; set; } = null!;
    public DbSet<UsuarioSupervisor> UsuariosSupervisores { get; set; } = null!;

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
            e.HasIndex(x => x.Nome).IsUnique();

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

        modelBuilder.Entity<Models.Checklist>(e =>
        {
            e.Property(x => x.ObservacoesGerais).HasMaxLength(1000);
            e.Property(x => x.AssinaturaOperadorBase64);
            e.Property(x => x.AssinadoEm);

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
    }
}
