using Checklist.Api.Controllers.Features.Supervisor.Common;
using Checklist.Api.Data;
using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Tests.Supervisor.NaoOk;

internal static class SupervisorNaoOkWorkflowTestData
{
    internal sealed class Scenario : IDisposable
    {
        public Scenario(
            AppDbContext db,
            SupervisorContext context,
            UsuarioSupervisor supervisorOrigem,
            UsuarioSupervisor responsavel,
            ChecklistItem checklistItem)
        {
            Db = db;
            Context = context;
            SupervisorOrigem = supervisorOrigem;
            Responsavel = responsavel;
            ChecklistItem = checklistItem;
        }

        public AppDbContext Db { get; }
        public SupervisorContext Context { get; }
        public UsuarioSupervisor SupervisorOrigem { get; }
        public UsuarioSupervisor Responsavel { get; }
        public ChecklistItem ChecklistItem { get; }

        public void Dispose()
        {
            Db.Dispose();
        }
    }

    public static Scenario CreateBaseScenario(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        var setor = new Setor
        {
            Id = Guid.NewGuid(),
            Nome = "Operacao"
        };

        var supervisorOrigem = new UsuarioSupervisor
        {
            Id = Guid.NewGuid(),
            Nome = "Ana",
            Sobrenome = "Silva",
            Login = "ana.silva",
            SenhaHash = "hash",
            ForceChangePassword = false,
            SetorId = setor.Id,
            Setor = setor,
            Ativo = true
        };

        var responsavel = new UsuarioSupervisor
        {
            Id = Guid.NewGuid(),
            Nome = "Bruno",
            Sobrenome = "Souza",
            Login = "bruno.souza",
            SenhaHash = "hash",
            ForceChangePassword = false,
            SetorId = setor.Id,
            Setor = setor,
            Ativo = true
        };

        var categoria = new CategoriaEquipamento
        {
            Id = Guid.NewGuid(),
            Nome = "Empilhadeira Eletrica",
            SetorId = setor.Id,
            Setor = setor
        };

        var template = new ChecklistItemTemplate
        {
            Id = Guid.NewGuid(),
            SetorId = setor.Id,
            Setor = setor,
            CategoriaId = categoria.Id,
            Categoria = categoria,
            Ordem = 1,
            Descricao = "Freio de servico",
            Ativo = true
        };

        var equipamento = new Equipamento
        {
            Id = Guid.NewGuid(),
            Codigo = "EMP-001",
            Descricao = "Empilhadeira de teste",
            SetorId = setor.Id,
            Setor = setor,
            CategoriaId = categoria.Id,
            Categoria = categoria,
            Ativa = true,
            QrId = Guid.NewGuid()
        };

        var operador = new Operador
        {
            Id = Guid.NewGuid(),
            SetorId = setor.Id,
            Setor = setor,
            Matricula = "12345",
            Nome = "Carlos Operador",
            Ativo = true
        };

        var checklist = new Checklist.Api.Models.Checklist
        {
            Id = Guid.NewGuid(),
            SetorId = setor.Id,
            Setor = setor,
            EquipamentoId = equipamento.Id,
            Equipamento = equipamento,
            OperadorId = operador.Id,
            Operador = operador,
            DataReferencia = new DateTime(2026, 4, 27, 0, 0, 0, DateTimeKind.Utc),
            DataRealizacao = new DateTime(2026, 4, 27, 12, 0, 0, DateTimeKind.Utc),
            Aprovado = false,
            Status = ChecklistStatus.Pendente
        };

        var checklistItem = new ChecklistItem
        {
            Id = Guid.NewGuid(),
            ChecklistId = checklist.Id,
            Checklist = checklist,
            TemplateId = template.Id,
            Template = template,
            Ordem = 1,
            Descricao = "Freio de servico",
            Status = ItemStatus.NOK,
            Observacao = "Ruido ao acionar"
        };

        checklist.Itens.Add(checklistItem);

        db.Setores.Add(setor);
        db.UsuariosSupervisores.AddRange(supervisorOrigem, responsavel);
        db.CategoriasEquipamento.Add(categoria);
        db.ChecklistItensTemplate.Add(template);
        db.Equipamentos.Add(equipamento);
        db.Operadores.Add(operador);
        db.Checklists.Add(checklist);
        db.ChecklistItens.Add(checklistItem);
        db.SaveChanges();

        return new Scenario(
            db,
            new SupervisorContext(supervisorOrigem.Id, setor.Id),
            supervisorOrigem,
            responsavel,
            checklistItem);
    }
}
