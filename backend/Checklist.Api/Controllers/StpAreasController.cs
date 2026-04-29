using Checklist.Api.Data;
using Checklist.Api.Dtos;
using Checklist.Api.Models;
using Checklist.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Controllers;

[ApiController]
[Authorize(Policy = "SafetyWorkReady")]
[Route("api/stp/areas")]
public class StpAreasController : ControllerBase
{
    private readonly AppDbContext _db;

    public StpAreasController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StpAreaInspecaoDto>>> Listar()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var areas = await _db.StpAreasInspecao
            .AsNoTracking()
            .Include(x => x.ResponsavelSupervisor)
            .Where(x => x.SetorId == setorId.Value)
            .OrderBy(x => x.Nome)
            .Select(x => new StpAreaInspecaoDto(
                x.Id,
                x.SetorId,
                x.Nome,
                x.ResponsavelSupervisorId,
                x.ResponsavelSupervisor.Nome + " " + x.ResponsavelSupervisor.Sobrenome,
                x.Ativa
            ))
            .ToListAsync();

        return Ok(areas);
    }

    [HttpGet("responsaveis")]
    public async Task<ActionResult<IReadOnlyList<StpAreaResponsavelSupervisorDto>>> ListarResponsaveis()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var responsaveis = await _db.UsuariosSupervisores
            .AsNoTracking()
            .Where(x =>
                !x.IsMaster &&
                x.Ativo &&
                x.TipoUsuario == UsuarioTipoAcesso.Supervisor)
            .OrderBy(x => x.Nome)
            .ThenBy(x => x.Sobrenome)
            .Select(x => new StpAreaResponsavelSupervisorDto(
                x.Id,
                x.Nome + " " + x.Sobrenome
            ))
            .ToListAsync();

        return Ok(responsaveis);
    }

    [HttpPost]
    public async Task<ActionResult<StpAreaInspecaoDto>> Criar([FromBody] CriarOuAtualizarStpAreaInspecaoRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var validationError = await ValidateAsync(request, setorId.Value, null);
        if (validationError is not null)
            return validationError;

        var responsavel = await LoadResponsavelAsync(request.ResponsavelSupervisorId);
        var area = new StpAreaInspecao
        {
            SetorId = setorId.Value,
            Nome = request.Nome.Trim(),
            ResponsavelSupervisorId = responsavel.Id,
            Ativa = request.Ativa,
        };

        _db.StpAreasInspecao.Add(area);
        await _db.SaveChangesAsync();

        return Created($"/api/stp/areas/{area.Id}", new StpAreaInspecaoDto(
            area.Id,
            area.SetorId,
            area.Nome,
            area.ResponsavelSupervisorId,
            responsavel.Nome + " " + responsavel.Sobrenome,
            area.Ativa
        ));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<StpAreaInspecaoDto>> Atualizar(Guid id, [FromBody] CriarOuAtualizarStpAreaInspecaoRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var area = await _db.StpAreasInspecao
            .Include(x => x.ResponsavelSupervisor)
            .FirstOrDefaultAsync(x => x.Id == id && x.SetorId == setorId.Value);

        if (area is null)
            return NotFound(new { message = "Area de inspecao nao encontrada." });

        var validationError = await ValidateAsync(request, setorId.Value, area.Id);
        if (validationError is not null)
            return validationError;

        var responsavel = await LoadResponsavelAsync(request.ResponsavelSupervisorId);

        area.Nome = request.Nome.Trim();
        area.ResponsavelSupervisorId = responsavel.Id;
        area.Ativa = request.Ativa;

        await _db.SaveChangesAsync();

        return Ok(new StpAreaInspecaoDto(
            area.Id,
            area.SetorId,
            area.Nome,
            area.ResponsavelSupervisorId,
            responsavel.Nome + " " + responsavel.Sobrenome,
            area.Ativa
        ));
    }

    private async Task<ActionResult?> ValidateAsync(CriarOuAtualizarStpAreaInspecaoRequest request, Guid setorId, Guid? areaId)
    {
        if (string.IsNullOrWhiteSpace(request.Nome?.Trim()))
            return BadRequest(new { message = "O nome da area e obrigatorio." });

        if (request.ResponsavelSupervisorId == Guid.Empty)
            return BadRequest(new { message = "Selecione o supervisor responsavel pela area." });

        var nome = request.Nome.Trim();
        var jaExiste = await _db.StpAreasInspecao.AnyAsync(x =>
            x.SetorId == setorId &&
            x.Nome == nome &&
            (!areaId.HasValue || x.Id != areaId.Value));

        if (jaExiste)
            return Conflict(new { message = "Ja existe uma area com este nome no setor." });

        var responsavelExiste = await _db.UsuariosSupervisores.AnyAsync(x =>
            x.Id == request.ResponsavelSupervisorId &&
            !x.IsMaster &&
            x.Ativo &&
            x.TipoUsuario == UsuarioTipoAcesso.Supervisor);

        if (!responsavelExiste)
            return BadRequest(new { message = "Supervisor responsavel invalido ou inativo." });

        return null;
    }

    private async Task<UsuarioSupervisor> LoadResponsavelAsync(Guid supervisorId)
    {
        return await _db.UsuariosSupervisores
            .AsNoTracking()
            .FirstAsync(x =>
                x.Id == supervisorId &&
                !x.IsMaster &&
                x.Ativo &&
                x.TipoUsuario == UsuarioTipoAcesso.Supervisor);
    }
}
