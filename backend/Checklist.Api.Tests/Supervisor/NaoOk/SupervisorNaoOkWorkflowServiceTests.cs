using Checklist.Api.Controllers.Features.Supervisor.NaoOk;
using Checklist.Api.Data;
using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Tests.Supervisor.NaoOk;

public class SupervisorNaoOkWorkflowServiceTests
{
    [Fact]
    public async Task AtribuirAsync_DeveCriarTratativaEHistorico()
    {
        using var scenario = SupervisorNaoOkWorkflowTestData.CreateBaseScenario(nameof(AtribuirAsync_DeveCriarTratativaEHistorico));
        var queryService = new SupervisorNaoOkQueryService(scenario.Db);
        var sut = new SupervisorNaoOkWorkflowService(scenario.Db, queryService);

        var request = new AtribuirItemNaoOkRequest(
            scenario.Responsavel.Id,
            "Enviar para manutencao",
            "Aguardando janela de parada",
            new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc),
            25);

        var result = await sut.AtribuirAsync(scenario.Context, scenario.ChecklistItem.Id, request);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.Equal("em-andamento", result.Value!.WorkflowStatus);
        Assert.Equal(scenario.Responsavel.Id, result.Value.ResponsavelSupervisorId);
        Assert.Equal(25, result.Value.PercentualConclusao);
        Assert.Contains(result.Value.Historico!, h => h.Titulo == "Tratativa atribuida");

        var itemPersistido = await scenario.Db.ChecklistItens
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
            .FirstAsync(i => i.Id == scenario.ChecklistItem.Id);

        Assert.NotNull(itemPersistido.Acao);
        Assert.Equal(ItemNaoOkAcaoStatus.EmAndamento, itemPersistido.Acao!.Status);
        Assert.Single(itemPersistido.Acao.Historico);
    }

    [Fact]
    public async Task AtualizarTratativaAsync_DeveRegistrarDiffNoHistorico()
    {
        using var scenario = SupervisorNaoOkWorkflowTestData.CreateBaseScenario(nameof(AtualizarTratativaAsync_DeveRegistrarDiffNoHistorico));
        var acao = new ChecklistItemAcao
        {
            ChecklistItemId = scenario.ChecklistItem.Id,
            ChecklistItem = scenario.ChecklistItem,
            Status = ItemNaoOkAcaoStatus.EmAndamento,
            AprovadoPorSupervisorId = scenario.Context.SupervisorId,
            AprovadoPorSupervisor = scenario.SupervisorOrigem,
            AprovadoEm = new DateTime(2026, 4, 27, 12, 30, 0, DateTimeKind.Utc),
            ResponsavelSupervisorId = scenario.SupervisorOrigem.Id,
            ResponsavelSupervisor = scenario.SupervisorOrigem,
            ResponsavelSetorId = scenario.Context.SetorId,
            ResponsavelSetor = scenario.SupervisorOrigem.Setor,
            ObservacaoResponsavel = "Verificar componente",
            DataPrevistaConclusao = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
            PercentualConclusao = 10
        };

        scenario.ChecklistItem.Acao = acao;
        scenario.Db.ChecklistItensAcoes.Add(acao);
        scenario.Db.SaveChanges();

        var queryService = new SupervisorNaoOkQueryService(scenario.Db);
        var sut = new SupervisorNaoOkWorkflowService(scenario.Db, queryService);

        var request = new AtualizarTratativaItemNaoOkRequest(
            scenario.Responsavel.Id,
            "Peca separada para troca",
            new DateTime(2026, 4, 29, 0, 0, 0, DateTimeKind.Utc),
            60);

        var result = await sut.AtualizarTratativaAsync(scenario.Context, scenario.ChecklistItem.Id, request);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.Equal(60, result.Value!.PercentualConclusao);
        Assert.Contains(result.Value.Historico!, h => h.Titulo == "Tratativa atualizada");

        var itemPersistido = await scenario.Db.ChecklistItens
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
            .FirstAsync(i => i.Id == scenario.ChecklistItem.Id);

        Assert.Equal(scenario.Responsavel.Id, itemPersistido.Acao!.ResponsavelSupervisorId);
        Assert.Equal(60, itemPersistido.Acao.PercentualConclusao);
        Assert.Equal("Peca separada para troca", itemPersistido.Acao.ObservacaoResponsavel);
        Assert.Contains(itemPersistido.Acao.Historico, h => h.Descricao.Contains("Percentual de conclusao alterado de 10% para 60%."));
    }

    [Fact]
    public async Task ConcluirAsync_SemTratativaPrevia_DeveCriarAcaoConcluida()
    {
        using var scenario = SupervisorNaoOkWorkflowTestData.CreateBaseScenario(nameof(ConcluirAsync_SemTratativaPrevia_DeveCriarAcaoConcluida));
        var queryService = new SupervisorNaoOkQueryService(scenario.Db);
        var sut = new SupervisorNaoOkWorkflowService(scenario.Db, queryService);

        var result = await sut.ConcluirAsync(scenario.Context, scenario.ChecklistItem.Id);

        Assert.True(result.Success);
        Assert.NotNull(result.Value);
        Assert.Equal("concluida", result.Value!.WorkflowStatus);
        Assert.Equal(100, result.Value.PercentualConclusao);
        Assert.Contains(result.Value.Historico!, h => h.Titulo == "Tratativa concluida");

        var itemPersistido = await scenario.Db.ChecklistItens
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
            .FirstAsync(i => i.Id == scenario.ChecklistItem.Id);

        Assert.NotNull(itemPersistido.Acao);
        Assert.Equal(ItemNaoOkAcaoStatus.Concluida, itemPersistido.Acao!.Status);
        Assert.Equal(100, itemPersistido.Acao.PercentualConclusao);
        Assert.Equal(scenario.Context.SupervisorId, itemPersistido.Acao.ConcluidoPorSupervisorId);
    }
}
