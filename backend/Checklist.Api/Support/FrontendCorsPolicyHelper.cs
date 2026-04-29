using Checklist.Api.Options;

namespace Checklist.Api.Support;

public static class FrontendCorsPolicyHelper
{
    public static string[] ResolveAllowedOrigins(IConfiguration configuration)
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

    public static bool IsAllowedFrontendOrigin(
        string origin,
        string[] configuredOrigins,
        LegacyHostingCompatibilityOptions compatibilityOptions)
    {
        if (configuredOrigins.Any(x => string.Equals(x, origin, StringComparison.OrdinalIgnoreCase)))
            return true;

        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            return false;

        if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
            return true;

        return compatibilityOptions.AllowVercelPreviewOrigins &&
               uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase);
    }
}
