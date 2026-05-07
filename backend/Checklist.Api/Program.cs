using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Checklist.Api.Controllers.Features.Supervisor.Checklists;
using Checklist.Api.Controllers.Features.Supervisor.Dashboard;
using Checklist.Api.Controllers.Features.Supervisor.NaoOk;
using Checklist.Api.Data;
using Checklist.Api.Models;
using Checklist.Api.Options;
using Checklist.Api.Security;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySql.EntityFrameworkCore.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection("Auth"));
builder.Services.Configure<LegacyHostingCompatibilityOptions>(
    builder.Configuration.GetSection(LegacyHostingCompatibilityOptions.SectionName));

var authOptions = builder.Configuration.GetSection("Auth").Get<AuthOptions>() ?? new AuthOptions();
if (string.IsNullOrWhiteSpace(authOptions.JwtKey))
    throw new InvalidOperationException("Auth:JwtKey precisa estar configurado.");

var compatibilityOptions =
    builder.Configuration.GetSection(LegacyHostingCompatibilityOptions.SectionName).Get<LegacyHostingCompatibilityOptions>()
    ?? new LegacyHostingCompatibilityOptions();

builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        var configuredOrigins = FrontendCorsPolicyHelper.ResolveAllowedOrigins(builder.Configuration);

        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins(configuredOrigins
                    .Concat(["http://localhost:5173", "http://localhost:5174"])
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray())
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.SetIsOriginAllowed(origin => FrontendCorsPolicyHelper.IsAllowedFrontendOrigin(origin, configuredOrigins, compatibilityOptions))
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

var connectionString = LegacyHostingConnectionStringResolver.Resolve(builder.Configuration, compatibilityOptions);

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:Default precisa estar configurado para o MySQL.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseMySQL(connectionString));
builder.Services.AddSingleton<PasswordHashingService>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<ChecklistMonthlyPdfService>();
builder.Services.AddScoped<SupervisorLoginGenerator>();
builder.Services.AddScoped<ChecklistStandardCatalogService>();
builder.Services.AddScoped<StpAreaTemplateCatalogService>();
builder.Services.AddScoped<BootstrapDataSeeder>();
builder.Services.AddScoped<ChecklistMonthlyClosingService>();
builder.Services.AddScoped<SupervisorDashboardQueryService>();
builder.Services.AddScoped<SupervisorChecklistQueryService>();
builder.Services.AddScoped<SupervisorNaoOkQueryService>();
builder.Services.AddScoped<SupervisorNaoOkWorkflowService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = authOptions.Issuer,
            ValidAudience = authOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.JwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SupervisorReady", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context => !CurrentSupervisorClaims.GetForceChangePassword(context.User));
    });

    options.AddPolicy("SectorSupervisorReady", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            !CurrentSupervisorClaims.GetForceChangePassword(context.User) &&
            !CurrentSupervisorClaims.GetIsMaster(context.User) &&
            string.Equals(CurrentSupervisorClaims.GetUserType(context.User), UsuarioTipoAcesso.Supervisor.ToString(), StringComparison.Ordinal) &&
            CurrentSupervisorClaims.HasModuleAccess(context.User, AccessModuleCatalog.SupervisaoOperacional));
    });

    options.AddPolicy("SafetyWorkReady", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            !CurrentSupervisorClaims.GetForceChangePassword(context.User) &&
            !CurrentSupervisorClaims.GetIsMaster(context.User) &&
            string.Equals(CurrentSupervisorClaims.GetUserType(context.User), UsuarioTipoAcesso.Inspetor.ToString(), StringComparison.Ordinal) &&
            CurrentSupervisorClaims.HasModuleAccess(context.User, AccessModuleCatalog.SegurancaTrabalho));
    });

    options.AddPolicy("MaterialsInspectionReady", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            !CurrentSupervisorClaims.GetForceChangePassword(context.User) &&
            !CurrentSupervisorClaims.GetIsMaster(context.User) &&
            string.Equals(CurrentSupervisorClaims.GetUserType(context.User), UsuarioTipoAcesso.Inspetor.ToString(), StringComparison.Ordinal) &&
            CurrentSupervisorClaims.HasModuleAccess(context.User, AccessModuleCatalog.InspecaoMateriais));
    });

    options.AddPolicy("MasterReady", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            !CurrentSupervisorClaims.GetForceChangePassword(context.User) &&
            CurrentSupervisorClaims.GetIsMaster(context.User));
    });

    options.AddPolicy("OperatorAuthenticated", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            CurrentOperadorClaims.GetOperadorId(context.User).HasValue &&
            CurrentOperadorClaims.GetSetorId(context.User).HasValue);
    });

    options.AddPolicy("OperatorChecklistReady", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            CurrentOperadorClaims.GetOperadorId(context.User).HasValue &&
            CurrentOperadorClaims.GetSetorId(context.User).HasValue &&
            !CurrentOperadorClaims.GetForceChangePassword(context.User));
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(int.Parse(port));
    });
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var runMigrations = Environment.GetEnvironmentVariable("RUN_DB_MIGRATIONS");
    var runSeed = Environment.GetEnvironmentVariable("RUN_DB_SEED");

    if (string.Equals(runMigrations, "true", StringComparison.OrdinalIgnoreCase))
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }

    if (string.Equals(runSeed, "true", StringComparison.OrdinalIgnoreCase))
    {
        var bootstrapDataSeeder = scope.ServiceProvider.GetRequiredService<BootstrapDataSeeder>();
        await bootstrapDataSeeder.SeedAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

app.Run();
