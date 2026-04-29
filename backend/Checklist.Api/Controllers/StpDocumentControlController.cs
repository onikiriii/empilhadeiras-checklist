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
[Route("api/stp/document-control")]
public class StpDocumentControlController : ControllerBase
{
    private const long MaxUploadSizeBytes = 15 * 1024 * 1024;
    private readonly AppDbContext _db;

    public StpDocumentControlController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("companies")]
    public async Task<ActionResult<IReadOnlyList<StpDocumentoEmpresaSummaryDto>>> ListCompanies()
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var companies = await _db.StpDocumentosEmpresas
            .AsNoTracking()
            .Where(x => x.SetorId == setorId.Value)
            .OrderBy(x => x.Nome)
            .Select(x => new StpDocumentoEmpresaSummaryDto(
                x.Id,
                x.SetorId,
                x.Nome,
                x.Ativa,
                x.Documentos.Count,
                x.Funcionarios.Count
            ))
            .ToListAsync();

        return Ok(companies);
    }

    [HttpPost("companies")]
    public async Task<ActionResult<StpDocumentoEmpresaSummaryDto>> CreateCompany([FromBody] StpDocumentoEmpresaRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var companyName = NormalizeRequiredName(request.Nome, "O nome da empresa e obrigatorio.");
        if (companyName is null)
            return BadRequest(new { message = "O nome da empresa e obrigatorio." });

        var alreadyExists = await _db.StpDocumentosEmpresas.AnyAsync(x =>
            x.SetorId == setorId.Value &&
            x.Nome == companyName);

        if (alreadyExists)
            return Conflict(new { message = "Ja existe uma empresa com este nome no setor." });

        var company = new StpDocumentoEmpresa
        {
            SetorId = setorId.Value,
            Nome = companyName,
            Ativa = request.Ativa
        };

        _db.StpDocumentosEmpresas.Add(company);
        await _db.SaveChangesAsync();

        return Created($"/api/stp/document-control/companies/{company.Id}", new StpDocumentoEmpresaSummaryDto(
            company.Id,
            company.SetorId,
            company.Nome,
            company.Ativa,
            0,
            0
        ));
    }

    [HttpPut("companies/{companyId:guid}")]
    public async Task<ActionResult<StpDocumentoEmpresaSummaryDto>> UpdateCompany(Guid companyId, [FromBody] StpDocumentoEmpresaRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var company = await _db.StpDocumentosEmpresas
            .Include(x => x.Documentos)
            .Include(x => x.Funcionarios)
            .FirstOrDefaultAsync(x => x.Id == companyId && x.SetorId == setorId.Value);

        if (company is null)
            return NotFound(new { message = "Empresa nao encontrada." });

        var companyName = NormalizeRequiredName(request.Nome, "O nome da empresa e obrigatorio.");
        if (companyName is null)
            return BadRequest(new { message = "O nome da empresa e obrigatorio." });

        var alreadyExists = await _db.StpDocumentosEmpresas.AnyAsync(x =>
            x.SetorId == setorId.Value &&
            x.Nome == companyName &&
            x.Id != companyId);

        if (alreadyExists)
            return Conflict(new { message = "Ja existe uma empresa com este nome no setor." });

        company.Nome = companyName;
        company.Ativa = request.Ativa;
        await _db.SaveChangesAsync();

        return Ok(new StpDocumentoEmpresaSummaryDto(
            company.Id,
            company.SetorId,
            company.Nome,
            company.Ativa,
            company.Documentos.Count,
            company.Funcionarios.Count
        ));
    }

    [HttpGet("companies/{companyId:guid}/documents")]
    public async Task<ActionResult<IReadOnlyList<StpDocumentoArquivoDto>>> ListCompanyDocuments(Guid companyId)
    {
        var company = await LoadCompanyForSectorAsync(companyId);
        if (company is null)
            return NotFound(new { message = "Empresa nao encontrada." });

        var documents = await _db.StpDocumentosEmpresasArquivos
            .AsNoTracking()
            .Where(x => x.EmpresaId == companyId)
            .OrderByDescending(x => x.CriadoEm)
            .Select(x => new StpDocumentoArquivoDto(
                x.Id,
                x.Nome,
                x.NomeArquivoOriginal,
                x.MimeType,
                x.TamanhoBytes,
                x.CriadoEm
            ))
            .ToListAsync();

        return Ok(documents);
    }

    [HttpPost("companies/{companyId:guid}/documents")]
    [RequestSizeLimit(MaxUploadSizeBytes)]
    public async Task<ActionResult<StpDocumentoArquivoDto>> UploadCompanyDocument(Guid companyId, [FromForm] string? nome, [FromForm] IFormFile? arquivo)
    {
        var company = await LoadCompanyForSectorAsync(companyId);
        if (company is null)
            return NotFound(new { message = "Empresa nao encontrada." });

        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (supervisorId is null)
            return Unauthorized(new { message = "Inspetor sem contexto valido." });

        var validationError = await ValidateUploadAsync(arquivo);
        if (validationError is not null)
            return validationError;

        await using var stream = new MemoryStream();
        await arquivo!.CopyToAsync(stream);

        var document = new StpDocumentoEmpresaArquivo
        {
            EmpresaId = company.Id,
            Nome = NormalizeDocumentName(nome, arquivo.FileName),
            NomeArquivoOriginal = Path.GetFileName(arquivo.FileName),
            MimeType = string.IsNullOrWhiteSpace(arquivo.ContentType) ? "application/octet-stream" : arquivo.ContentType,
            TamanhoBytes = arquivo.Length,
            Conteudo = stream.ToArray(),
            EnviadoPorSupervisorId = supervisorId.Value
        };

        _db.StpDocumentosEmpresasArquivos.Add(document);
        await _db.SaveChangesAsync();

        return Created($"/api/stp/document-control/company-documents/{document.Id}/file", ToDocumentDto(document));
    }

    [HttpGet("company-documents/{documentId:guid}/file")]
    public async Task<IActionResult> ViewCompanyDocument(Guid documentId)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var document = await _db.StpDocumentosEmpresasArquivos
            .AsNoTracking()
            .Include(x => x.Empresa)
            .FirstOrDefaultAsync(x => x.Id == documentId && x.Empresa.SetorId == setorId.Value);

        if (document is null)
            return NotFound(new { message = "Documento da empresa nao encontrado." });

        return File(document.Conteudo, document.MimeType, document.NomeArquivoOriginal, enableRangeProcessing: true);
    }

    [HttpGet("companies/{companyId:guid}/employees")]
    public async Task<ActionResult<IReadOnlyList<StpDocumentoFuncionarioSummaryDto>>> ListEmployees(Guid companyId)
    {
        var company = await LoadCompanyForSectorAsync(companyId);
        if (company is null)
            return NotFound(new { message = "Empresa nao encontrada." });

        var employees = await _db.StpDocumentosFuncionarios
            .AsNoTracking()
            .Where(x => x.EmpresaId == companyId)
            .OrderBy(x => x.Nome)
            .Select(x => new StpDocumentoFuncionarioSummaryDto(
                x.Id,
                x.EmpresaId,
                x.Nome,
                x.Cargo,
                x.Ativo,
                x.Documentos.Count
            ))
            .ToListAsync();

        return Ok(employees);
    }

    [HttpPost("companies/{companyId:guid}/employees")]
    public async Task<ActionResult<StpDocumentoFuncionarioSummaryDto>> CreateEmployee(Guid companyId, [FromBody] StpDocumentoFuncionarioRequest request)
    {
        var company = await LoadCompanyForSectorAsync(companyId);
        if (company is null)
            return NotFound(new { message = "Empresa nao encontrada." });

        var employeeName = NormalizeRequiredName(request.Nome, "O nome do funcionario e obrigatorio.");
        if (employeeName is null)
            return BadRequest(new { message = "O nome do funcionario e obrigatorio." });

        var alreadyExists = await _db.StpDocumentosFuncionarios.AnyAsync(x =>
            x.EmpresaId == companyId &&
            x.Nome == employeeName);

        if (alreadyExists)
            return Conflict(new { message = "Ja existe um funcionario com este nome nesta empresa." });

        var employee = new StpDocumentoFuncionario
        {
            EmpresaId = companyId,
            Nome = employeeName,
            Cargo = NormalizeOptionalText(request.Cargo),
            Ativo = request.Ativo
        };

        _db.StpDocumentosFuncionarios.Add(employee);
        await _db.SaveChangesAsync();

        return Created($"/api/stp/document-control/employees/{employee.Id}", new StpDocumentoFuncionarioSummaryDto(
            employee.Id,
            employee.EmpresaId,
            employee.Nome,
            employee.Cargo,
            employee.Ativo,
            0
        ));
    }

    [HttpPut("employees/{employeeId:guid}")]
    public async Task<ActionResult<StpDocumentoFuncionarioSummaryDto>> UpdateEmployee(Guid employeeId, [FromBody] StpDocumentoFuncionarioRequest request)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var employee = await _db.StpDocumentosFuncionarios
            .Include(x => x.Empresa)
            .Include(x => x.Documentos)
            .FirstOrDefaultAsync(x => x.Id == employeeId && x.Empresa.SetorId == setorId.Value);

        if (employee is null)
            return NotFound(new { message = "Funcionario nao encontrado." });

        var employeeName = NormalizeRequiredName(request.Nome, "O nome do funcionario e obrigatorio.");
        if (employeeName is null)
            return BadRequest(new { message = "O nome do funcionario e obrigatorio." });

        var alreadyExists = await _db.StpDocumentosFuncionarios.AnyAsync(x =>
            x.EmpresaId == employee.EmpresaId &&
            x.Nome == employeeName &&
            x.Id != employeeId);

        if (alreadyExists)
            return Conflict(new { message = "Ja existe um funcionario com este nome nesta empresa." });

        employee.Nome = employeeName;
        employee.Cargo = NormalizeOptionalText(request.Cargo);
        employee.Ativo = request.Ativo;
        await _db.SaveChangesAsync();

        return Ok(new StpDocumentoFuncionarioSummaryDto(
            employee.Id,
            employee.EmpresaId,
            employee.Nome,
            employee.Cargo,
            employee.Ativo,
            employee.Documentos.Count
        ));
    }

    [HttpGet("employees/{employeeId:guid}/documents")]
    public async Task<ActionResult<IReadOnlyList<StpDocumentoArquivoDto>>> ListEmployeeDocuments(Guid employeeId)
    {
        var employee = await LoadEmployeeForSectorAsync(employeeId);
        if (employee is null)
            return NotFound(new { message = "Funcionario nao encontrado." });

        var documents = await _db.StpDocumentosFuncionariosArquivos
            .AsNoTracking()
            .Where(x => x.FuncionarioId == employeeId)
            .OrderByDescending(x => x.CriadoEm)
            .Select(x => new StpDocumentoArquivoDto(
                x.Id,
                x.Nome,
                x.NomeArquivoOriginal,
                x.MimeType,
                x.TamanhoBytes,
                x.CriadoEm
            ))
            .ToListAsync();

        return Ok(documents);
    }

    [HttpPost("employees/{employeeId:guid}/documents")]
    [RequestSizeLimit(MaxUploadSizeBytes)]
    public async Task<ActionResult<StpDocumentoArquivoDto>> UploadEmployeeDocument(Guid employeeId, [FromForm] string? nome, [FromForm] IFormFile? arquivo)
    {
        var employee = await LoadEmployeeForSectorAsync(employeeId);
        if (employee is null)
            return NotFound(new { message = "Funcionario nao encontrado." });

        var supervisorId = CurrentSupervisorClaims.GetSupervisorId(User);
        if (supervisorId is null)
            return Unauthorized(new { message = "Inspetor sem contexto valido." });

        var validationError = await ValidateUploadAsync(arquivo);
        if (validationError is not null)
            return validationError;

        await using var stream = new MemoryStream();
        await arquivo!.CopyToAsync(stream);

        var document = new StpDocumentoFuncionarioArquivo
        {
            FuncionarioId = employee.Id,
            Nome = NormalizeDocumentName(nome, arquivo.FileName),
            NomeArquivoOriginal = Path.GetFileName(arquivo.FileName),
            MimeType = string.IsNullOrWhiteSpace(arquivo.ContentType) ? "application/octet-stream" : arquivo.ContentType,
            TamanhoBytes = arquivo.Length,
            Conteudo = stream.ToArray(),
            EnviadoPorSupervisorId = supervisorId.Value
        };

        _db.StpDocumentosFuncionariosArquivos.Add(document);
        await _db.SaveChangesAsync();

        return Created($"/api/stp/document-control/employee-documents/{document.Id}/file", ToDocumentDto(document));
    }

    [HttpGet("employee-documents/{documentId:guid}/file")]
    public async Task<IActionResult> ViewEmployeeDocument(Guid documentId)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return Unauthorized(new { message = "Inspetor sem setor associado." });

        var document = await _db.StpDocumentosFuncionariosArquivos
            .AsNoTracking()
            .Include(x => x.Funcionario)
                .ThenInclude(x => x.Empresa)
            .FirstOrDefaultAsync(x => x.Id == documentId && x.Funcionario.Empresa.SetorId == setorId.Value);

        if (document is null)
            return NotFound(new { message = "Documento do funcionario nao encontrado." });

        return File(document.Conteudo, document.MimeType, document.NomeArquivoOriginal, enableRangeProcessing: true);
    }

    private async Task<StpDocumentoEmpresa?> LoadCompanyForSectorAsync(Guid companyId)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return null;

        return await _db.StpDocumentosEmpresas
            .FirstOrDefaultAsync(x => x.Id == companyId && x.SetorId == setorId.Value);
    }

    private async Task<StpDocumentoFuncionario?> LoadEmployeeForSectorAsync(Guid employeeId)
    {
        var setorId = CurrentSupervisorClaims.GetSetorId(User);
        if (setorId is null)
            return null;

        return await _db.StpDocumentosFuncionarios
            .Include(x => x.Empresa)
            .FirstOrDefaultAsync(x => x.Id == employeeId && x.Empresa.SetorId == setorId.Value);
    }

    private static async Task<ActionResult?> ValidateUploadAsync(IFormFile? arquivo)
    {
        if (arquivo is null || arquivo.Length == 0)
            return new BadRequestObjectResult(new { message = "Selecione um arquivo para envio." });

        if (arquivo.Length > MaxUploadSizeBytes)
            return new BadRequestObjectResult(new { message = "O arquivo excede o limite de 15 MB." });

        await Task.CompletedTask;
        return null;
    }

    private static string? NormalizeRequiredName(string? value, string _)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string NormalizeDocumentName(string? providedName, string fileName)
    {
        var normalized = providedName?.Trim();
        if (!string.IsNullOrWhiteSpace(normalized))
            return normalized;

        return Path.GetFileNameWithoutExtension(fileName);
    }

    private static StpDocumentoArquivoDto ToDocumentDto(StpDocumentoEmpresaArquivo document)
    {
        return new StpDocumentoArquivoDto(
            document.Id,
            document.Nome,
            document.NomeArquivoOriginal,
            document.MimeType,
            document.TamanhoBytes,
            document.CriadoEm
        );
    }

    private static StpDocumentoArquivoDto ToDocumentDto(StpDocumentoFuncionarioArquivo document)
    {
        return new StpDocumentoArquivoDto(
            document.Id,
            document.Nome,
            document.NomeArquivoOriginal,
            document.MimeType,
            document.TamanhoBytes,
            document.CriadoEm
        );
    }
}
