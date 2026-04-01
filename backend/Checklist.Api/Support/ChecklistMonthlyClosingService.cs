using System.Security.Cryptography;
using System.Text.Json;
using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Support;

public class ChecklistMonthlyClosingService
{
    private readonly AppDbContext _db;
    private readonly ChecklistMonthlyPdfService _pdfService;

    public ChecklistMonthlyClosingService(AppDbContext db, ChecklistMonthlyPdfService pdfService)
    {
        _db = db;
        _pdfService = pdfService;
    }

    public async Task<List<FechamentoChecklistMensalResumoDto>> ListarAsync(Guid setorId, int? ano, int? mes, Guid? equipamentoId)
    {
        var query = _db.FechamentosChecklistMensais
            .AsNoTracking()
            .Include(x => x.Equipamento)
            .Include(x => x.FechadoPorSupervisor)
            .Where(x => x.SetorId == setorId);

        if (ano is not null)
            query = query.Where(x => x.Ano == ano.Value);
        if (mes is not null)
            query = query.Where(x => x.Mes == mes.Value);
        if (equipamentoId is not null && equipamentoId != Guid.Empty)
            query = query.Where(x => x.EquipamentoId == equipamentoId.Value);

        return await query
            .OrderByDescending(x => x.Ano)
            .ThenByDescending(x => x.Mes)
            .ThenBy(x => x.Equipamento.Codigo)
            .Select(x => new FechamentoChecklistMensalResumoDto(
                x.Id,
                x.EquipamentoId,
                x.Equipamento.Codigo,
                x.Equipamento.Descricao,
                x.Ano,
                x.Mes,
                x.QuantidadeChecklists,
                x.TemplateVersao,
                x.NomeArquivoPdf,
                x.FechadoEm,
                x.FechadoPorSupervisor.Nome + " " + x.FechadoPorSupervisor.Sobrenome
            ))
            .ToListAsync();
    }

    public async Task<FechamentoChecklistMensalPreviewDto> BuildPreviewAsync(Guid setorId, Guid equipamentoId, int ano, int mes, bool preferSnapshot = true)
    {
        var existing = preferSnapshot
            ? await _db.FechamentosChecklistMensais
                .AsNoTracking()
                .Include(x => x.Equipamento)
                .Include(x => x.Setor)
                .FirstOrDefaultAsync(x => x.SetorId == setorId && x.EquipamentoId == equipamentoId && x.Ano == ano && x.Mes == mes)
            : null;

        if (existing is not null)
            return ToPreviewDto(existing.Id, Deserialize(existing.SnapshotJson), true);

        var snapshot = await BuildLiveSnapshotAsync(setorId, equipamentoId, ano, mes);
        return ToPreviewDto(null, snapshot, false);
    }

    public async Task<FechamentoChecklistMensal> CloseAsync(Guid setorId, Guid supervisorId, Guid equipamentoId, int ano, int mes)
    {
        var existing = await _db.FechamentosChecklistMensais
            .FirstOrDefaultAsync(x => x.SetorId == setorId && x.EquipamentoId == equipamentoId && x.Ano == ano && x.Mes == mes);

        if (existing is not null)
            return existing;

        var snapshot = await BuildLiveSnapshotAsync(setorId, equipamentoId, ano, mes);
        var workbookBytes = _pdfService.Generate(snapshot);
        var hash = Convert.ToHexString(SHA256.HashData(workbookBytes));
        var fileName = $"CheckFlow_{snapshot.EquipamentoCodigo}_{ano}-{mes:00}.xlsx";

        var fechamento = new FechamentoChecklistMensal
        {
            SetorId = setorId,
            EquipamentoId = equipamentoId,
            FechadoPorSupervisorId = supervisorId,
            Ano = ano,
            Mes = mes,
            TemplateNome = "Checklist - Empilhadeiras",
            TemplateVersao = snapshot.ModeloFechamentoMensal switch
            {
                FechamentoMensalModelo.EmpilhadeiraCombustao => "F_PTV_0208_a",
                FechamentoMensalModelo.EmpilhadeiraEletrica => "F_PTV_0208_b",
                _ => "v1"
            },
            SnapshotJson = JsonSerializer.Serialize(snapshot),
            NomeArquivoPdf = fileName,
            HashPdfSha256 = hash,
            PdfConteudo = workbookBytes,
            QuantidadeChecklists = snapshot.TotalChecklistsConsiderados,
            FechadoEm = DateTime.UtcNow,
            CriadoEm = DateTime.UtcNow
        };

        foreach (var dia in snapshot.Dias)
        {
            fechamento.Checklists.Add(new FechamentoChecklistMensalChecklist
            {
                ChecklistId = dia.ChecklistId
            });
        }

        _db.FechamentosChecklistMensais.Add(fechamento);
        await _db.SaveChangesAsync();

        return fechamento;
    }

    public async Task<FechamentoChecklistMensal?> GetClosingAsync(Guid setorId, Guid fechamentoId)
    {
        return await _db.FechamentosChecklistMensais
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == fechamentoId && x.SetorId == setorId);
    }

    private async Task<ChecklistMonthlySnapshot> BuildLiveSnapshotAsync(Guid setorId, Guid equipamentoId, int ano, int mes)
    {
        var equipamento = await _db.Equipamentos
            .AsNoTracking()
            .Include(x => x.Setor)
            .Include(x => x.Categoria)
            .FirstOrDefaultAsync(x => x.Id == equipamentoId && x.SetorId == setorId);

        if (equipamento is null)
            throw new InvalidOperationException("Equipamento nao encontrado para este setor.");

        if (equipamento.Categoria.ModeloFechamentoMensal == FechamentoMensalModelo.Nenhum)
            throw new InvalidOperationException("A categoria deste equipamento nao possui modelo de fechamento mensal configurado.");

        var inicio = new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc);
        var fim = inicio.AddMonths(1);
        var diasNoMes = DateTime.DaysInMonth(ano, mes);

        var checklists = await _db.Checklists
            .AsNoTracking()
            .Include(x => x.Operador)
            .Include(x => x.Itens)
            .Where(x =>
                x.SetorId == setorId &&
                x.EquipamentoId == equipamentoId &&
                x.DataReferencia >= inicio &&
                x.DataReferencia < fim)
            .OrderBy(x => x.DataRealizacao)
            .ToListAsync();

        var templateItems = await _db.ChecklistItensTemplate
            .AsNoTracking()
            .Where(x => x.CategoriaId == equipamento.CategoriaId && x.Ativo)
            .OrderBy(x => x.Ordem)
            .Select(x => new
            {
                x.Ordem,
                x.Descricao
            })
            .ToListAsync();

        var avisos = new List<string>();
        var groupedByDay = checklists
            .GroupBy(x => x.DataReferencia.Day)
            .OrderBy(x => x.Key)
            .ToList();

        foreach (var group in groupedByDay.Where(x => x.Count() > 1))
            avisos.Add($"Dia {group.Key:00}: encontrados {group.Count()} checklists. Foi considerado o ultimo do dia.");

        var selected = groupedByDay
            .Select(g => g.OrderByDescending(x => x.DataRealizacao).First())
            .OrderBy(x => x.DataReferencia)
            .ToList();

        var missingDays = Enumerable.Range(1, diasNoMes)
            .Except(selected.Select(x => x.DataReferencia.Day))
            .ToList();

        if (missingDays.Count > 0)
            avisos.Add($"Dias sem checklist: {string.Join(", ", missingDays.Select(x => x.ToString("00")))}.");

        var rowDefinitions = templateItems.Count > 0
            ? templateItems
            : selected
                .SelectMany(x => x.Itens)
                .GroupBy(x => x.Ordem)
                .OrderBy(x => x.Key)
                .Select(g => new
                {
                    Ordem = g.Key,
                    Descricao = g.Select(x => x.Descricao).FirstOrDefault() ?? string.Empty
                })
                .ToList();

        var linhas = rowDefinitions.Select(row =>
        {
            var valores = Enumerable.Repeat<string?>(null, 31).ToList();
            foreach (var checklist in selected)
            {
                var item = checklist.Itens.FirstOrDefault(x => x.Ordem == row.Ordem);
                if (item is not null)
                    valores[checklist.DataReferencia.Day - 1] = ToCellValue(item.Status);
            }

            return new ChecklistMonthlyRowSnapshot
            {
                Ordem = row.Ordem,
                Descricao = row.Descricao,
                ValoresPorDia = valores
            };
        }).ToList();

        var comentarios = new List<string>();
        foreach (var checklist in selected)
        {
            var day = checklist.DataReferencia.Day;
            var operador = $"{checklist.Operador.Matricula} - {checklist.Operador.Nome}";

            if (!string.IsNullOrWhiteSpace(checklist.ObservacoesGerais))
                comentarios.Add($"Dia {day:00} - {operador} - Observacoes gerais: {checklist.ObservacoesGerais}");

            foreach (var item in checklist.Itens.Where(x => x.Status == ItemStatus.NOK))
            {
                var detalhe = string.IsNullOrWhiteSpace(item.Observacao) ? "Sem detalhe informado." : item.Observacao!;
                comentarios.Add($"Dia {day:00} - {operador} - Item {item.Ordem} - {item.Descricao} - NAO OK - {detalhe}");
            }
        }

        var operadores = selected
            .Select(x => $"{x.Operador.Nome} / {x.Operador.Matricula}")
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        return new ChecklistMonthlySnapshot
        {
            EquipamentoId = equipamento.Id,
            CategoriaId = equipamento.CategoriaId,
            CategoriaNome = equipamento.Categoria.Nome,
            ModeloFechamentoMensal = equipamento.Categoria.ModeloFechamentoMensal,
            EquipamentoCodigo = equipamento.Codigo,
            EquipamentoDescricao = equipamento.Descricao,
            SetorNome = equipamento.Setor.Nome,
            Ano = ano,
            Mes = mes,
            DiasNoMes = diasNoMes,
            TotalDiasComChecklist = selected.Count,
            TotalChecklistsConsiderados = selected.Count,
            Linhas = linhas,
            Dias = selected.Select(x => new ChecklistMonthlyDaySnapshot
            {
                Dia = x.DataReferencia.Day,
                ChecklistId = x.Id,
                OperadorNome = x.Operador.Nome,
                OperadorMatricula = x.Operador.Matricula,
                DataRealizacao = x.DataRealizacao
            }).ToList(),
            Comentarios = comentarios,
            OperadoresConsolidados = operadores,
            Avisos = avisos
        };
    }

    private static string ToCellValue(ItemStatus status)
    {
        return status switch
        {
            ItemStatus.OK => "V",
            ItemStatus.NOK => "X",
            ItemStatus.NA => "|",
            _ => string.Empty
        };
    }

    private static ChecklistMonthlySnapshot Deserialize(string json)
    {
        return JsonSerializer.Deserialize<ChecklistMonthlySnapshot>(json)
            ?? throw new InvalidOperationException("Snapshot mensal invalido.");
    }

    private static FechamentoChecklistMensalPreviewDto ToPreviewDto(Guid? fechamentoId, ChecklistMonthlySnapshot snapshot, bool jaFechado)
    {
        return new FechamentoChecklistMensalPreviewDto(
            jaFechado,
            fechamentoId,
            snapshot.EquipamentoId,
            snapshot.EquipamentoCodigo,
            snapshot.EquipamentoDescricao,
            snapshot.SetorNome,
            snapshot.Ano,
            snapshot.Mes,
            snapshot.TotalDiasComChecklist,
            snapshot.TotalChecklistsConsiderados,
            snapshot.Linhas.Select(x => new FechamentoChecklistMensalLinhaDto(x.Ordem, x.Descricao, x.ValoresPorDia)).ToList(),
            snapshot.Dias.Select(x => new FechamentoChecklistMensalDiaDto(x.Dia, x.ChecklistId, x.OperadorNome, x.OperadorMatricula, x.DataRealizacao)).ToList(),
            snapshot.Comentarios,
            snapshot.OperadoresConsolidados,
            snapshot.Avisos
        );
    }
}
