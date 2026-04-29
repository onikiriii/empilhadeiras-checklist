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
    public DbSet<StpAreaInspecao> StpAreasInspecao { get; set; } = null!;
    public DbSet<StpDocumentoEmpresa> StpDocumentosEmpresas { get; set; } = null!;
    public DbSet<StpDocumentoEmpresaArquivo> StpDocumentosEmpresasArquivos { get; set; } = null!;
    public DbSet<StpDocumentoFuncionario> StpDocumentosFuncionarios { get; set; } = null!;
    public DbSet<StpDocumentoFuncionarioArquivo> StpDocumentosFuncionariosArquivos { get; set; } = null!;
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
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
