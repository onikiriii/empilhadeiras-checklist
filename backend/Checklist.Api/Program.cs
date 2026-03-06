using System.Text.Json;
using System.Text.Json.Serialization;
using Checklist.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1) Configurar JSON camelCase + Enum como string
builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 2) CORS - Configurar para desenvolvimento e produção
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Produção: aceita qualquer origem Vercel
            policy.SetIsOriginAllowed(origin => 
                origin.Contains("vercel.app") || 
                origin.Contains("localhost"))
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// 3) EF Core (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

// Se for URL do Railway (postgresql://), converter para connection string
if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("postgresql://"))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.Trim('/')};Username={userInfo[0]};Password={userInfo[1]}";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 4) Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 5) Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// 6) Configurar porta para Railway
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(int.Parse(port));
});

var app = builder.Build();

// 7) Aplicar migrações automaticamente em produção
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// 8) Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Não usar HTTPS Redirection em produção (Railway já usa HTTPS)
if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors("frontend");
app.UseAuthorization();
app.MapControllers();

app.Run();

// 3) EF Core (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// 4) Swagger (se você usa)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 5) Logging (bom para debug)
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// 6) Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("frontend"); // ← CORS antes de UseAuthorization

app.UseAuthorization();

app.MapControllers();

app.Run();
