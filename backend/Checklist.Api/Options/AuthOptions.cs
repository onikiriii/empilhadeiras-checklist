namespace Checklist.Api.Options;

public class AuthOptions
{
    public string JwtKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "CheckFlow.Api";
    public string Audience { get; set; } = "CheckFlow.Web";
    public int TokenExpirationMinutes { get; set; } = 480;
    public BootstrapSupervisorOptions BootstrapSupervisor { get; set; } = new();
}

public class BootstrapSupervisorOptions
{
    public string Nome { get; set; } = "Administrador";
    public string Sobrenome { get; set; } = "CheckFlow";
    public string? Email { get; set; } = "admin@checkflow.local";
    public string Senha { get; set; } = "CheckFlow@2026!";
    public bool ForceChangePassword { get; set; } = false;
    public bool IsMaster { get; set; } = true;
    public string SetorNome { get; set; } = "Admin";
    public string? Ramal { get; set; } = null;
}
