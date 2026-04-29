namespace Checklist.Api.Options;

public class LegacyHostingCompatibilityOptions
{
    public const string SectionName = "LegacyHostingCompatibility";

    public bool EnableRailwayEnvironmentFallback { get; set; } = true;
    public bool ApplyMigrationsOnStartup { get; set; } = true;
    public bool SeedOnStartup { get; set; } = true;
    public bool AllowVercelPreviewOrigins { get; set; } = true;
    public string MySqlSslMode { get; set; } = "Disabled";
    public bool AllowPublicKeyRetrieval { get; set; } = true;
}
