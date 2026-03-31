using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Checklist.Api.Data;
using Checklist.Api.Options;
using Checklist.Api.Security;
using Checklist.Api.Support;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySql.EntityFrameworkCore.Extensions;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection("Auth"));

var authOptions = builder.Configuration.GetSection("Auth").Get<AuthOptions>() ?? new AuthOptions();
if (string.IsNullOrWhiteSpace(authOptions.JwtKey))
    throw new InvalidOperationException("Auth:JwtKey precisa estar configurado.");

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
        var configuredOrigins = ResolveAllowedOrigins(builder.Configuration);

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
            policy.SetIsOriginAllowed(origin => IsAllowedFrontendOrigin(origin, configuredOrigins))
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

var connectionString = ResolveConnectionString(builder.Configuration);

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:Default precisa estar configurado para o MySQL.");

if (connectionString.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    var database = uri.AbsolutePath.Trim('/');
    var portNumber = uri.IsDefaultPort ? 3306 : uri.Port;

    connectionString =
        $"Server={uri.Host};Port={portNumber};Database={database};User ID={Uri.UnescapeDataString(userInfo[0])};Password={Uri.UnescapeDataString(userInfo[1])};SslMode=Disabled;AllowPublicKeyRetrieval=True;";
}

builder.Services.AddDbContext<AppDbContext>(options => options.UseMySQL(connectionString));
builder.Services.AddSingleton<PasswordHashingService>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<ChecklistMonthlyPdfService>();
builder.Services.AddScoped<SupervisorLoginGenerator>();
builder.Services.AddScoped<ChecklistStandardCatalogService>();
builder.Services.AddScoped<BootstrapDataSeeder>();
builder.Services.AddScoped<ChecklistMonthlyClosingService>();

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
            !CurrentSupervisorClaims.GetIsMaster(context.User));
    });

    options.AddPolicy("MasterReady", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            !CurrentSupervisorClaims.GetForceChangePassword(context.User) &&
            CurrentSupervisorClaims.GetIsMaster(context.User));
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

QuestPDF.Settings.License = LicenseType.Community;

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var bootstrapDataSeeder = scope.ServiceProvider.GetRequiredService<BootstrapDataSeeder>();
    await bootstrapDataSeeder.SeedAsync();
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

static string? ResolveConnectionString(IConfiguration configuration)
{
    var directConnectionString = configuration.GetConnectionString("Default")
        ?? configuration.GetConnectionString("DefaultConnection")
        ?? configuration.GetConnectionString("AppDbConnectionString")
        ?? Environment.GetEnvironmentVariable("MYSQL_URL")
        ?? Environment.GetEnvironmentVariable("DATABASE_URL")
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

    if (!string.IsNullOrWhiteSpace(directConnectionString))
        return directConnectionString;

    var host = Environment.GetEnvironmentVariable("MYSQLHOST") ?? configuration["MYSQLHOST"];
    var database = Environment.GetEnvironmentVariable("MYSQLDATABASE") ?? configuration["MYSQLDATABASE"];
    var user = Environment.GetEnvironmentVariable("MYSQLUSER") ?? configuration["MYSQLUSER"];
    var password = Environment.GetEnvironmentVariable("MYSQLPASSWORD") ?? configuration["MYSQLPASSWORD"];
    var port = Environment.GetEnvironmentVariable("MYSQLPORT") ?? configuration["MYSQLPORT"] ?? "3306";

    if (string.IsNullOrWhiteSpace(host) ||
        string.IsNullOrWhiteSpace(database) ||
        string.IsNullOrWhiteSpace(user) ||
        string.IsNullOrWhiteSpace(password))
    {
        return null;
    }

    return $"Server={host};Port={port};Database={database};User ID={user};Password={password};SslMode=Disabled;AllowPublicKeyRetrieval=True;";
}

static string[] ResolveAllowedOrigins(IConfiguration configuration)
{
    var configOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    var envOrigins = (Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS") ?? string.Empty)
        .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");

    return configOrigins
        .Concat(envOrigins)
        .Concat(string.IsNullOrWhiteSpace(frontendUrl) ? [] : [frontendUrl])
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

static bool IsAllowedFrontendOrigin(string origin, string[] configuredOrigins)
{
    if (configuredOrigins.Any(x => string.Equals(x, origin, StringComparison.OrdinalIgnoreCase)))
        return true;

    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
        return false;

    return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
           uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase);
}
