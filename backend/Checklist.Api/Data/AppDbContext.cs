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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração para timestamp (without time zone)
        modelBuilder.Entity<ChecklistEnviado>()
            .Property(x => x.CriadoEm)
            .HasColumnType("timestamp");

        // Configuração do Operador
        modelBuilder.Entity<Operador>(e =>
        {
            e.HasIndex(x => x.Matricula).IsUnique();
            e.Property(x => x.Matricula).HasMaxLength(20).IsRequired();
            e.Property(x => x.Nome).HasMaxLength(100).IsRequired();
        });

        // Configuração da Categoria
        modelBuilder.Entity<CategoriaEquipamento>(e =>
        {
            e.Property(x => x.Nome).HasMaxLength(80).IsRequired();
            e.HasIndex(x => x.Nome).IsUnique();
        });

        // Configuração do Equipamento
        modelBuilder.Entity<Equipamento>(e =>
        {
            e.HasIndex(x => x.QrId).IsUnique();

            e.HasOne(x => x.Categoria)
             .WithMany(c => c.Equipamentos)
             .HasForeignKey(x => x.CategoriaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração do Template
        modelBuilder.Entity<ChecklistItemTemplate>(e =>
        {
            e.Property(x => x.Descricao).HasMaxLength(200).IsRequired();
            e.Property(x => x.Instrucao).HasMaxLength(500);

            e.HasIndex(x => new { x.CategoriaId, x.Ordem });

            e.HasOne(x => x.Categoria)
             .WithMany(c => c.ChecklistItensTemplate)
             .HasForeignKey(x => x.CategoriaId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Configuração do Checklist
        modelBuilder.Entity<Models.Checklist>(e =>
        {
            e.Property(x => x.ObservacoesGerais).HasMaxLength(1000);

            e.HasOne(x => x.Equipamento)
             .WithMany()
             .HasForeignKey(x => x.EquipamentoId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Operador)
             .WithMany()
             .HasForeignKey(x => x.OperadorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuração do Item do Checklist
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