using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "SectorSupervisorReady")]
[Route("api/supervisor")]
public class SupervisorController : ControllerBase
{
    private readonly AppDbContext _db;

    public SupervisorController(AppDbContext db) => _db = db;

    public record EquipamentoStatusDto(string Codigo, string Descricao, bool TemChecklistHoje);

    [HttpGet("equipamentos-status")]
    public async Task<ActionResult<List<EquipamentoStatusDto>>> ObterStatusEquipamentos()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var hoje = BusinessDate.TodayKeyUtc();

        var lista = await _db.Equipamentos
            .AsNoTracking()
            .Where(e => e.Ativa && e.SetorId == setorId.Value)
            .OrderBy(e => e.Codigo)
            .Select(e => new EquipamentoStatusDto(
                e.Codigo,
                e.Descricao,
                _db.Checklists.Any(c => c.EquipamentoId == e.Id && c.SetorId == setorId.Value && c.DataReferencia == hoje)
            ))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("checklist/{codigo}/hoje")]
    public async Task<ActionResult<ChecklistDto>> ObterChecklistHoje(string codigo)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var hoje = BusinessDate.TodayKeyUtc();
        codigo = (codigo ?? string.Empty).Trim().ToUpperInvariant();

        var checklist = await _db.Checklists
            .AsNoTracking()
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .Where(c => c.SetorId == setorId.Value && c.Equipamento.Codigo == codigo && c.DataReferencia == hoje)
            .OrderByDescending(c => c.DataRealizacao)
            .FirstOrDefaultAsync();

        if (checklist is null)
            return NotFound(new { message = "Nenhum checklist encontrado para hoje neste equipamento." });

        return Ok(new ChecklistDto(
            checklist.Id,
            checklist.SetorId,
            checklist.EquipamentoId,
            checklist.Equipamento.Codigo,
            checklist.OperadorId,
            checklist.Operador.Nome,
            checklist.DataRealizacao,
            checklist.Aprovado,
            checklist.ObservacoesGerais,
            checklist.Status,
            checklist.AssinaturaOperadorBase64,
            checklist.Itens.Select(i => new ChecklistItemDto(
                i.Id,
                i.TemplateId,
                i.Ordem,
                i.Descricao,
                i.Instrucao,
                i.Status,
                i.Observacao,
                i.ImagemNokBase64,
                i.ImagemNokNomeArquivo,
                i.ImagemNokMimeType
            )).ToList()
        ));
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var hoje = BusinessDate.TodayKeyUtc();

        var equipamentos = await _db.Equipamentos
            .Where(e => e.Ativa && e.SetorId == setorId.Value)
            .Include(e => e.Categoria)
            .ToListAsync();

        var result = new List<object>();

        foreach (var eq in equipamentos)
        {
            var checklistHoje = await _db.Checklists
                .Where(c => c.SetorId == setorId.Value && c.EquipamentoId == eq.Id && c.DataReferencia == hoje)
                .Include(c => c.Itens)
                .FirstOrDefaultAsync();

            var status = checklistHoje is null
                ? "nao-preenchido"
                : checklistHoje.Itens.Any(i => i.Status == ItemStatus.NOK) ? "nok" : "ok";

            result.Add(new
            {
                id = eq.Id,
                setorId = eq.SetorId,
                codigo = eq.Codigo,
                descricao = eq.Descricao,
                categoriaNome = eq.Categoria?.Nome,
                status,
                checklistId = checklistHoje?.Id,
                criadoEm = checklistHoje?.DataRealizacao
            });
        }

        return Ok(result);
    }

    [HttpGet("checklists")]
    public async Task<ActionResult<List<object>>> ListarChecklists(
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] string? status,
        [FromQuery] string? operador)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var query = _db.Checklists
            .Where(c => c.SetorId == setorId.Value)
            .Include(c => c.Equipamento)
            .Include(c => c.Operador)
            .Include(c => c.Itens)
            .AsQueryable();

        if (!string.IsNullOrEmpty(dataInicio))
        {
            var inicio = DateTime.Parse(dataInicio);
            var inicioUtc = new DateTime(inicio.Year, inicio.Month, inicio.Day, 0, 0, 0, DateTimeKind.Utc);
            query = query.Where(c => c.DataReferencia >= inicioUtc);
        }

        if (!string.IsNullOrEmpty(dataFim))
        {
            var fim = DateTime.Parse(dataFim);
            var fimUtc = new DateTime(fim.Year, fim.Month, fim.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            query = query.Where(c => c.DataReferencia < fimUtc);
        }

        if (!string.IsNullOrEmpty(status))
        {
            var statusOk = status.ToLower() == "ok";
            query = query.Where(c => c.Aprovado == statusOk);
        }

        if (!string.IsNullOrEmpty(operador))
        {
            var operadorNormalizado = operador.ToLower();
            query = query.Where(c =>
                c.Operador.Nome.ToLower().Contains(operadorNormalizado) ||
                c.Operador.Matricula.Contains(operador));
        }

        var lista = await query
            .OrderByDescending(c => c.DataRealizacao)
            .Select(c => new
            {
                c.Id,
                c.SetorId,
                EquipamentoCodigo = c.Equipamento.Codigo,
                EquipamentoDescricao = c.Equipamento.Descricao,
                OperadorNome = c.Operador.Nome,
                OperadorMatricula = c.Operador.Matricula,
                CriadoEm = c.DataRealizacao,
                Status = c.Aprovado ? "ok" : "nok",
                TotalItens = c.Itens.Count,
                ItensOk = c.Itens.Count(i => i.Status == ItemStatus.OK),
                ItensNok = c.Itens.Count(i => i.Status == ItemStatus.NOK)
            })
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("itens-nao-ok")]
    public async Task<ActionResult<List<ItemNaoOkDto>>> ListarItensNaoOk(
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] string? equipamento,
        [FromQuery] string? operador)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var query = _db.ChecklistItens
            .AsNoTracking()
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Where(i =>
                i.Checklist.SetorId == setorId.Value &&
                i.Status == ItemStatus.NOK)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(dataInicio))
        {
            var inicio = DateTime.Parse(dataInicio);
            var inicioUtc = new DateTime(inicio.Year, inicio.Month, inicio.Day, 0, 0, 0, DateTimeKind.Utc);
            query = query.Where(i => i.Checklist.DataReferencia >= inicioUtc);
        }

        if (!string.IsNullOrWhiteSpace(dataFim))
        {
            var fim = DateTime.Parse(dataFim);
            var fimUtc = new DateTime(fim.Year, fim.Month, fim.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            query = query.Where(i => i.Checklist.DataReferencia < fimUtc);
        }

        if (!string.IsNullOrWhiteSpace(equipamento))
        {
            var equipamentoNormalizado = equipamento.Trim().ToLower();
            query = query.Where(i =>
                i.Checklist.Equipamento.Codigo.ToLower().Contains(equipamentoNormalizado) ||
                i.Checklist.Equipamento.Descricao.ToLower().Contains(equipamentoNormalizado));
        }

        if (!string.IsNullOrWhiteSpace(operador))
        {
            var operadorNormalizado = operador.Trim().ToLower();
            query = query.Where(i =>
                i.Checklist.Operador.Nome.ToLower().Contains(operadorNormalizado) ||
                i.Checklist.Operador.Matricula.Contains(operador));
        }

        var lista = await query
            .OrderByDescending(i => i.Checklist.DataRealizacao)
            .ThenBy(i => i.Checklist.Equipamento.Codigo)
            .ThenBy(i => i.Ordem)
            .Select(i => new ItemNaoOkDto(
                i.ChecklistId,
                i.Id,
                i.Checklist.DataRealizacao,
                i.Checklist.Equipamento.Codigo,
                i.Checklist.Equipamento.Descricao,
                i.Checklist.Operador.Nome,
                i.Checklist.Operador.Matricula,
                i.Ordem,
                i.Descricao,
                i.Instrucao,
                i.Observacao,
                i.ImagemNokBase64,
                i.ImagemNokNomeArquivo,
                i.ImagemNokMimeType
            ))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("itens-nao-ok/painel")]
    public async Task<ActionResult<ItemNaoOkPainelDto>> ObterPainelItensNaoOk(
        [FromQuery] string? dataInicio,
        [FromQuery] string? dataFim,
        [FromQuery] string? equipamento,
        [FromQuery] string? operador)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (setorId is null || supervisorId is null)
            return Unauthorized(new { message = "Supervisor sem contexto valido." });

        var query = _db.ChecklistItens
            .AsNoTracking()
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Setor)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSetor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.AprovadoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ConcluidoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
                    .ThenInclude(h => h.CriadoPorSupervisor)
            .Where(i =>
                i.Status == ItemStatus.NOK &&
                (
                    (i.Checklist.SetorId == setorId.Value && i.Acao == null) ||
                    (i.Acao != null &&
                     (i.Checklist.SetorId == setorId.Value ||
                      i.Acao.ResponsavelSupervisorId == supervisorId.Value ||
                      i.Acao.ResponsavelSetorId == setorId.Value))
                ))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(dataInicio))
        {
            var inicio = DateTime.Parse(dataInicio);
            var inicioUtc = new DateTime(inicio.Year, inicio.Month, inicio.Day, 0, 0, 0, DateTimeKind.Utc);
            query = query.Where(i => i.Checklist.DataReferencia >= inicioUtc);
        }

        if (!string.IsNullOrWhiteSpace(dataFim))
        {
            var fim = DateTime.Parse(dataFim);
            var fimUtc = new DateTime(fim.Year, fim.Month, fim.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            query = query.Where(i => i.Checklist.DataReferencia < fimUtc);
        }

        if (!string.IsNullOrWhiteSpace(equipamento))
        {
            var equipamentoNormalizado = equipamento.Trim().ToLower();
            query = query.Where(i =>
                i.Checklist.Equipamento.Codigo.ToLower().Contains(equipamentoNormalizado) ||
                i.Checklist.Equipamento.Descricao.ToLower().Contains(equipamentoNormalizado));
        }

        if (!string.IsNullOrWhiteSpace(operador))
        {
            var operadorNormalizado = operador.Trim().ToLower();
            query = query.Where(i =>
                i.Checklist.Operador.Nome.ToLower().Contains(operadorNormalizado) ||
                i.Checklist.Operador.Matricula.Contains(operador));
        }

        var itens = (await query
            .OrderByDescending(i => i.Checklist.DataRealizacao)
            .ThenBy(i => i.Checklist.Equipamento.Codigo)
            .ThenBy(i => i.Ordem)
            .ToListAsync())
            .Select(i => ToPainelItemDto(i, includeHistory: true))
            .ToList();

        return Ok(new ItemNaoOkPainelDto(
            itens.Where(i => i.WorkflowStatus == "pendente-aprovacao").ToList(),
            itens.Where(i => i.WorkflowStatus == "em-andamento").ToList(),
            itens.Where(i => i.WorkflowStatus == "concluida").ToList()
        ));
    }

    [HttpGet("itens-nao-ok/responsaveis")]
    public async Task<ActionResult<List<SupervisorResponsavelOptionDto>>> ListarResponsaveisItensNaoOk()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Supervisor sem setor associado." });

        var lista = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .Where(x => x.Ativo && !x.IsMaster && x.Setor.Ativo)
            .OrderBy(x => x.Setor.Nome)
            .ThenBy(x => x.Nome)
            .ThenBy(x => x.Sobrenome)
            .Select(x => new SupervisorResponsavelOptionDto(
                x.Id,
                $"{x.Nome} {x.Sobrenome}",
                x.Login,
                x.SetorId,
                x.Setor.Nome
            ))
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("itens-nao-ok/{checklistItemId:guid}")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> ObterItemNaoOk(Guid checklistItemId)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (setorId is null || supervisorId is null)
            return Unauthorized(new { message = "Supervisor sem contexto valido." });

        var item = await _db.ChecklistItens
            .AsNoTracking()
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Setor)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSetor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.AprovadoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ConcluidoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
                    .ThenInclude(h => h.CriadoPorSupervisor)
            .FirstOrDefaultAsync(i =>
                i.Id == checklistItemId &&
                i.Status == ItemStatus.NOK &&
                (
                    (i.Checklist.SetorId == setorId.Value && i.Acao == null) ||
                    (i.Acao != null &&
                     (i.Checklist.SetorId == setorId.Value ||
                      i.Acao.ResponsavelSupervisorId == supervisorId.Value ||
                      i.Acao.ResponsavelSetorId == setorId.Value))
                ));

        if (item is null)
            return NotFound(new { message = "Item nao OK nao encontrado." });

        return Ok(ToPainelItemDto(item, includeHistory: true));
    }

    [HttpPost("itens-nao-ok/{checklistItemId:guid}/atribuir")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> AprovarEAtribuirItemNaoOk(
        Guid checklistItemId,
        [FromBody] AtribuirItemNaoOkRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (setorId is null || supervisorId is null)
            return Unauthorized(new { message = "Supervisor sem contexto valido." });

        var item = await _db.ChecklistItens
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Setor)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Include(i => i.Acao)
            .FirstOrDefaultAsync(i => i.Id == checklistItemId);

        if (item is null)
            return NotFound(new { message = "Item nao OK nao encontrado." });

        if (item.Checklist.SetorId != setorId.Value)
            return Forbid();

        if (item.Status != ItemStatus.NOK)
            return BadRequest(new { message = "Apenas itens NOK podem virar tratativas." });

        if (item.Acao is not null)
            return Conflict(new { message = "Este item ja possui uma tratativa registrada." });

        var responsavel = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Id == request.ResponsavelSupervisorId && x.Ativo && !x.IsMaster);

        if (responsavel is null || !responsavel.Setor.Ativo)
            return BadRequest(new { message = "Responsavel informado nao esta disponivel para atribuicao." });

        var acao = new ChecklistItemAcao
        {
            ChecklistItemId = item.Id,
            Status = ItemNaoOkAcaoStatus.EmAndamento,
            AprovadoPorSupervisorId = supervisorId.Value,
            AprovadoEm = DateTime.UtcNow,
            ResponsavelSupervisorId = responsavel.Id,
            ResponsavelSetorId = responsavel.SetorId,
            ObservacaoAtribuicao = NormalizeOptionalText(request.ObservacaoAtribuicao),
            ObservacaoResponsavel = NormalizeOptionalText(request.ObservacaoResponsavel),
            DataPrevistaConclusao = NormalizeDateOnly(request.DataPrevistaConclusao),
            PercentualConclusao = NormalizePercentualConclusao(request.PercentualConclusao)
        };

        _db.ChecklistItensAcoes.Add(acao);
        _db.ChecklistItensAcoesHistorico.Add(CreateHistoricoEntry(
            acao,
            supervisorId.Value,
            "Tratativa atribuida",
            BuildTratativaCriadaDescricao(responsavel, acao)
        ));
        await _db.SaveChangesAsync();

        var dto = await LoadPainelItemDtoAsync(item.Id);
        return Ok(dto);
    }

    [HttpPut("itens-nao-ok/{checklistItemId:guid}/tratativa")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> AtualizarTratativaItemNaoOk(
        Guid checklistItemId,
        [FromBody] AtualizarTratativaItemNaoOkRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (setorId is null || supervisorId is null)
            return Unauthorized(new { message = "Supervisor sem contexto valido." });

        var item = await _db.ChecklistItens
            .Include(i => i.Checklist)
            .Include(i => i.Acao)
            .FirstOrDefaultAsync(i => i.Id == checklistItemId);

        if (item is null)
            return NotFound(new { message = "Item nao OK nao encontrado." });

        if (item.Status != ItemStatus.NOK)
            return BadRequest(new { message = "Apenas itens NOK podem ser editados neste fluxo." });

        if (item.Acao is null)
            return BadRequest(new { message = "Este item ainda nao possui tratativa para ser editada." });

        if (item.Acao.Status == ItemNaoOkAcaoStatus.Concluida)
            return Conflict(new { message = "Tratativas concluidas nao podem ser editadas." });

        var podeEditar = item.Checklist.SetorId == setorId.Value ||
                         item.Acao.ResponsavelSupervisorId == supervisorId.Value ||
                         item.Acao.ResponsavelSetorId == setorId.Value;

        if (!podeEditar)
            return Forbid();

        var responsavel = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Include(x => x.Setor)
            .FirstOrDefaultAsync(x => x.Id == request.ResponsavelSupervisorId && x.Ativo && !x.IsMaster);

        if (responsavel is null || !responsavel.Setor.Ativo)
            return BadRequest(new { message = "Responsavel informado nao esta disponivel para atribuicao." });

        var changes = new List<string>();
        var normalizedObservacaoResponsavel = NormalizeOptionalText(request.ObservacaoResponsavel);
        var normalizedDataPrevista = NormalizeDateOnly(request.DataPrevistaConclusao);
        var normalizedPercentual = NormalizePercentualConclusao(request.PercentualConclusao);

        if (item.Acao.ResponsavelSupervisorId != responsavel.Id)
        {
            changes.Add($"Responsavel alterado para {responsavel.Nome} {responsavel.Sobrenome} ({responsavel.Setor.Nome}).");
            item.Acao.ResponsavelSupervisorId = responsavel.Id;
            item.Acao.ResponsavelSetorId = responsavel.SetorId;
        }

        if (!string.Equals(item.Acao.ObservacaoResponsavel, normalizedObservacaoResponsavel, StringComparison.Ordinal))
        {
            changes.Add($"Observacao do responsavel alterada de {DescribeOptional(item.Acao.ObservacaoResponsavel)} para {DescribeOptional(normalizedObservacaoResponsavel)}.");
            item.Acao.ObservacaoResponsavel = normalizedObservacaoResponsavel;
        }

        if (item.Acao.DataPrevistaConclusao != normalizedDataPrevista)
        {
            changes.Add($"Data prevista alterada de {FormatHistoryDate(item.Acao.DataPrevistaConclusao)} para {FormatHistoryDate(normalizedDataPrevista)}.");
            item.Acao.DataPrevistaConclusao = normalizedDataPrevista;
        }

        if (item.Acao.PercentualConclusao != normalizedPercentual)
        {
            changes.Add($"Percentual de conclusao alterado de {item.Acao.PercentualConclusao}% para {normalizedPercentual}%.");
            item.Acao.PercentualConclusao = normalizedPercentual;
        }

        if (changes.Count == 0)
            return Ok(await LoadPainelItemDtoAsync(item.Id));

        _db.ChecklistItensAcoesHistorico.Add(CreateHistoricoEntry(
            item.Acao,
            supervisorId.Value,
            "Tratativa atualizada",
            string.Join(Environment.NewLine, changes)
        ));

        await _db.SaveChangesAsync();

        return Ok(await LoadPainelItemDtoAsync(item.Id));
    }

    [HttpPost("itens-nao-ok/{checklistItemId:guid}/concluir")]
    public async Task<ActionResult<ItemNaoOkPainelItemDto>> ConcluirItemNaoOk(Guid checklistItemId)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (setorId is null || supervisorId is null)
            return Unauthorized(new { message = "Supervisor sem contexto valido." });

        var item = await _db.ChecklistItens
            .Include(i => i.Checklist)
            .Include(i => i.Acao)
            .FirstOrDefaultAsync(i => i.Id == checklistItemId);

        if (item is null)
            return NotFound(new { message = "Item nao OK nao encontrado." });

        if (item.Status != ItemStatus.NOK)
            return BadRequest(new { message = "Apenas itens NOK podem ser concluidos neste fluxo." });

        var podeConcluir = item.Checklist.SetorId == setorId.Value ||
                           item.Acao?.ResponsavelSupervisorId == supervisorId.Value ||
                           item.Acao?.ResponsavelSetorId == setorId.Value;

        if (!podeConcluir)
            return Forbid();

        if (item.Acao is null)
        {
            var acao = new ChecklistItemAcao
            {
                ChecklistItemId = item.Id,
                Status = ItemNaoOkAcaoStatus.Concluida,
                AprovadoPorSupervisorId = supervisorId.Value,
                AprovadoEm = DateTime.UtcNow,
                ResponsavelSupervisorId = supervisorId.Value,
                ResponsavelSetorId = setorId.Value,
                PercentualConclusao = 100,
                ConcluidoPorSupervisorId = supervisorId.Value,
                ConcluidoEm = DateTime.UtcNow
            };

            _db.ChecklistItensAcoes.Add(acao);
            _db.ChecklistItensAcoesHistorico.Add(CreateHistoricoEntry(
                acao,
                supervisorId.Value,
                "Tratativa concluida",
                "O item foi concluido diretamente, sem atribuicao previa."
            ));
        }
        else
        {
            if (item.Acao.Status == ItemNaoOkAcaoStatus.Concluida)
                return Conflict(new { message = "Esta tratativa ja esta concluida." });

            item.Acao.Status = ItemNaoOkAcaoStatus.Concluida;
            item.Acao.PercentualConclusao = 100;
            item.Acao.ConcluidoPorSupervisorId = supervisorId.Value;
            item.Acao.ConcluidoEm = DateTime.UtcNow;

            if (item.Acao.ResponsavelSupervisorId is null)
            {
                item.Acao.ResponsavelSupervisorId = supervisorId.Value;
                item.Acao.ResponsavelSetorId = setorId.Value;
            }

            _db.ChecklistItensAcoesHistorico.Add(CreateHistoricoEntry(
                item.Acao,
                supervisorId.Value,
                "Tratativa concluida",
                $"Tratativa marcada como concluida com percentual final de {item.Acao.PercentualConclusao}%."
            ));
        }

        await _db.SaveChangesAsync();

        var dto = await LoadPainelItemDtoAsync(item.Id);
        return Ok(dto);
    }

    private async Task<ItemNaoOkPainelItemDto> LoadPainelItemDtoAsync(Guid checklistItemId)
    {
        var item = await _db.ChecklistItens
            .AsNoTracking()
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Setor)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Equipamento)
            .Include(i => i.Checklist)
                .ThenInclude(c => c.Operador)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ResponsavelSetor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.AprovadoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.ConcluidoPorSupervisor)
            .Include(i => i.Acao!)
                .ThenInclude(a => a.Historico)
                    .ThenInclude(h => h.CriadoPorSupervisor)
            .FirstAsync(i => i.Id == checklistItemId);

        return ToPainelItemDto(item, includeHistory: true);
    }

    private static ItemNaoOkPainelItemDto ToPainelItemDto(ChecklistItem i, bool includeHistory = false)
    {
        var workflowStatus = i.Acao is null
            ? "pendente-aprovacao"
            : i.Acao.Status == ItemNaoOkAcaoStatus.Concluida
                ? "concluida"
                : "em-andamento";

        return new ItemNaoOkPainelItemDto(
            i.ChecklistId,
            i.Id,
            i.Checklist.DataRealizacao,
            i.Checklist.SetorId,
            i.Checklist.Setor.Nome,
            i.Checklist.Equipamento.Codigo,
            i.Checklist.Equipamento.Descricao,
            i.Checklist.Operador.Nome,
            i.Checklist.Operador.Matricula,
            i.Ordem,
            i.Descricao,
            i.Instrucao,
            i.Observacao,
            i.ImagemNokBase64,
            i.ImagemNokNomeArquivo,
            i.ImagemNokMimeType,
            workflowStatus,
            i.Acao?.ResponsavelSupervisorId,
            i.Acao?.ResponsavelSupervisor is null
                ? null
                : $"{i.Acao.ResponsavelSupervisor.Nome} {i.Acao.ResponsavelSupervisor.Sobrenome}",
            i.Acao?.ResponsavelSetorId,
            i.Acao?.ResponsavelSetor?.Nome,
            i.Acao?.ObservacaoAtribuicao,
            i.Acao?.ObservacaoResponsavel,
            i.Acao?.DataPrevistaConclusao,
            i.Acao?.PercentualConclusao ?? 0,
            i.Acao?.AprovadoEm,
            i.Acao?.AprovadoPorSupervisor is null
                ? null
                : $"{i.Acao.AprovadoPorSupervisor.Nome} {i.Acao.AprovadoPorSupervisor.Sobrenome}",
            i.Acao?.ConcluidoEm,
            i.Acao?.ConcluidoPorSupervisor is null
                ? null
                : $"{i.Acao.ConcluidoPorSupervisor.Nome} {i.Acao.ConcluidoPorSupervisor.Sobrenome}"
            ,
            includeHistory ? BuildPainelHistorico(i) : null
        );
    }

    private static List<ItemNaoOkHistoricoEntryDto> BuildPainelHistorico(ChecklistItem item)
    {
        var entries = new List<ItemNaoOkHistoricoEntryDto>
        {
            new(
                Guid.Empty,
                "Ocorrencia registrada",
                $"{item.Checklist.Operador.Nome} registrou o item {item.Ordem} como nao OK no checklist.",
                item.Checklist.DataRealizacao,
                item.Checklist.Operador.Nome
            ),
        };

        if (item.Acao is null)
        {
            return entries
                .OrderByDescending(x => x.CriadoEm)
                .ToList();
        }

        var hasAssignedHistory = item.Acao.Historico.Any(h =>
            string.Equals(h.Titulo, "Tratativa atribuida", StringComparison.OrdinalIgnoreCase));

        if (!hasAssignedHistory)
        {
            entries.Add(new ItemNaoOkHistoricoEntryDto(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "Tratativa atribuida",
                BuildFallbackAssignedHistoryDescription(item),
                item.Acao.AprovadoEm,
                item.Acao.AprovadoPorSupervisor is null
                    ? "Supervisor"
                    : $"{item.Acao.AprovadoPorSupervisor.Nome} {item.Acao.AprovadoPorSupervisor.Sobrenome}"
            ));
        }

        if (item.Acao.Historico.Count > 0)
        {
            entries.AddRange(item.Acao.Historico
                .OrderByDescending(h => h.CriadoEm)
                .Select(h => new ItemNaoOkHistoricoEntryDto(
                    h.Id,
                    h.Titulo,
                    h.Descricao,
                    h.CriadoEm,
                    $"{h.CriadoPorSupervisor.Nome} {h.CriadoPorSupervisor.Sobrenome}"
                )));
        }
        else
        {
            if (item.Acao.ConcluidoEm is not null)
            {
                entries.Add(new ItemNaoOkHistoricoEntryDto(
                    Guid.NewGuid(),
                    "Tratativa concluida",
                    $"Tratativa marcada como concluida com percentual final de {item.Acao.PercentualConclusao}%.",
                    item.Acao.ConcluidoEm.Value,
                    item.Acao.ConcluidoPorSupervisor is null
                        ? "Supervisor"
                        : $"{item.Acao.ConcluidoPorSupervisor.Nome} {item.Acao.ConcluidoPorSupervisor.Sobrenome}"
                ));
            }
        }

        return entries
            .OrderByDescending(x => x.CriadoEm)
            .ToList();
    }

    private static ChecklistItemAcaoHistorico CreateHistoricoEntry(
        ChecklistItemAcao acao,
        Guid criadoPorSupervisorId,
        string titulo,
        string descricao)
    {
        return new ChecklistItemAcaoHistorico
        {
            ChecklistItemAcao = acao,
            CriadoPorSupervisorId = criadoPorSupervisorId,
            Titulo = titulo,
            Descricao = descricao
        };
    }

    private static string BuildTratativaCriadaDescricao(UsuarioSupervisor responsavel, ChecklistItemAcao acao)
    {
        var parts = new List<string>
        {
            $"Responsavel definido: {responsavel.Nome} {responsavel.Sobrenome} ({responsavel.Setor.Nome}).",
            $"Percentual inicial: {acao.PercentualConclusao}%."
        };

        if (acao.DataPrevistaConclusao is not null)
            parts.Add($"Data prevista de conclusao: {FormatHistoryDate(acao.DataPrevistaConclusao)}.");

        if (!string.IsNullOrWhiteSpace(acao.ObservacaoResponsavel))
            parts.Add($"Observacao do responsavel: {acao.ObservacaoResponsavel}.");

        return string.Join(Environment.NewLine, parts);
    }

    private static string BuildFallbackAssignedHistoryDescription(ChecklistItem item)
    {
        var responsavelNome = item.Acao?.ResponsavelSupervisor is null
            ? "Responsavel nao informado"
            : $"{item.Acao.ResponsavelSupervisor.Nome} {item.Acao.ResponsavelSupervisor.Sobrenome}";

        var parts = new List<string>
        {
            $"Responsavel definido: {responsavelNome}.",
            $"Percentual inicial: {item.Acao?.PercentualConclusao ?? 0}%.",
        };

        if (item.Acao?.DataPrevistaConclusao is not null)
            parts.Add($"Data prevista de conclusao: {FormatHistoryDate(item.Acao.DataPrevistaConclusao)}.");

        if (!string.IsNullOrWhiteSpace(item.Acao?.ObservacaoResponsavel))
            parts.Add($"Observacao do responsavel: {item.Acao.ObservacaoResponsavel}.");

        return string.Join(Environment.NewLine, parts);
    }

    private static string DescribeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? "\"-\"" : $"\"{value}\"";
    }

    private static string FormatHistoryDate(DateTime? value)
    {
        return value is null ? "-" : value.Value.ToString("dd/MM/yyyy");
    }

    private static DateTime? NormalizeDateOnly(DateTime? value)
    {
        if (value is null)
            return null;

        var utc = value.Value.Kind == DateTimeKind.Utc
            ? value.Value
            : value.Value.ToUniversalTime();

        return new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    private static int NormalizePercentualConclusao(int value)
    {
        return Math.Clamp(value, 0, 100);
    }

    private static string? NormalizeOptionalText(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
