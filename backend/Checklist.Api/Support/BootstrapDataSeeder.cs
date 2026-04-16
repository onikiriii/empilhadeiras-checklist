using Checklist.Api.Data;
using Checklist.Api.Models;
using Checklist.Api.Options;
using Checklist.Api.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Checklist.Api.Support;

public class BootstrapDataSeeder
{
    private readonly AppDbContext _db;
    private readonly PasswordHashingService _passwordHashingService;
    private readonly SupervisorLoginGenerator _supervisorLoginGenerator;
    private readonly ChecklistStandardCatalogService _checklistStandardCatalogService;
    private readonly StpAreaTemplateCatalogService _stpAreaTemplateCatalogService;
    private readonly AuthOptions _authOptions;

    public BootstrapDataSeeder(
        AppDbContext db,
        PasswordHashingService passwordHashingService,
        SupervisorLoginGenerator supervisorLoginGenerator,
        ChecklistStandardCatalogService checklistStandardCatalogService,
        StpAreaTemplateCatalogService stpAreaTemplateCatalogService,
        IOptions<AuthOptions> authOptions)
    {
        _db = db;
        _passwordHashingService = passwordHashingService;
        _supervisorLoginGenerator = supervisorLoginGenerator;
        _checklistStandardCatalogService = checklistStandardCatalogService;
        _stpAreaTemplateCatalogService = stpAreaTemplateCatalogService;
        _authOptions = authOptions.Value;
    }

    public async Task SeedAsync()
    {
        if (!await _db.UsuariosSupervisores.AnyAsync())
        {
            var bootstrap = _authOptions.BootstrapSupervisor;
            if (string.IsNullOrWhiteSpace(bootstrap.Nome) ||
                string.IsNullOrWhiteSpace(bootstrap.Sobrenome) ||
                string.IsNullOrWhiteSpace(bootstrap.Senha))
            {
                await _checklistStandardCatalogService.EnsureDefaultsForAllSetoresAsync();
                await _stpAreaTemplateCatalogService.EnsureDefaultsForAllSetoresAsync();
                return;
            }

            var setor = await _db.Setores.FirstOrDefaultAsync(x => x.Nome == bootstrap.SetorNome);

            if (setor is null)
            {
                setor = new Setor
                {
                    Nome = bootstrap.SetorNome,
                    Descricao = "Setor administrativo inicial criado automaticamente para o login master.",
                    Ativo = true
                };

                _db.Setores.Add(setor);
                await _db.SaveChangesAsync();
            }

            var login = await _supervisorLoginGenerator.GenerateUniqueLoginAsync(bootstrap.Nome, bootstrap.Sobrenome);

            var supervisor = new UsuarioSupervisor
            {
                Nome = bootstrap.Nome.Trim(),
                Sobrenome = bootstrap.Sobrenome.Trim(),
                Login = login,
                Email = string.IsNullOrWhiteSpace(bootstrap.Email) ? null : bootstrap.Email.Trim().ToLowerInvariant(),
                Ramal = string.IsNullOrWhiteSpace(bootstrap.Ramal) ? null : bootstrap.Ramal.Trim(),
                SenhaHash = _passwordHashingService.HashPassword(bootstrap.Senha),
                ForceChangePassword = bootstrap.ForceChangePassword,
                IsMaster = bootstrap.IsMaster,
                TipoUsuario = UsuarioTipoAcesso.Supervisor,
                SetorId = setor.Id,
                Ativo = true,
                Modulos =
                [
                    new UsuarioSupervisorModulo
                    {
                        Modulo = ModuloAcesso.SupervisaoOperacional
                    }
                ]
            };

            _db.UsuariosSupervisores.Add(supervisor);
            await _db.SaveChangesAsync();
        }

        await _checklistStandardCatalogService.EnsureDefaultsForAllSetoresAsync();
        await _stpAreaTemplateCatalogService.EnsureDefaultsForAllSetoresAsync();
    }
}
