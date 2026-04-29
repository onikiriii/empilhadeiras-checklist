using Checklist.Api.Options;

namespace Checklist.Api.Support;

public static class LegacyHostingConnectionStringResolver
{
    public static string? Resolve(
        IConfiguration configuration,
        LegacyHostingCompatibilityOptions compatibilityOptions)
    {
        var directConnectionString = configuration.GetConnectionString("Default")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? configuration.GetConnectionString("AppDbConnectionString")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (!string.IsNullOrWhiteSpace(directConnectionString))
            return NormalizeMySqlUrlIfNeeded(directConnectionString, compatibilityOptions);

        if (!compatibilityOptions.EnableRailwayEnvironmentFallback)
            return null;

        var legacyConnectionString = Environment.GetEnvironmentVariable("MYSQL_URL")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL");

        if (!string.IsNullOrWhiteSpace(legacyConnectionString))
            return NormalizeMySqlUrlIfNeeded(legacyConnectionString, compatibilityOptions);

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

        return BuildMySqlConnectionString(host, port, database, user, password, compatibilityOptions);
    }

    private static string NormalizeMySqlUrlIfNeeded(
        string connectionString,
        LegacyHostingCompatibilityOptions compatibilityOptions)
    {
        if (!connectionString.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase))
            return connectionString;

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var database = uri.AbsolutePath.Trim('/');
        var portNumber = uri.IsDefaultPort ? 3306 : uri.Port;

        return BuildMySqlConnectionString(
            uri.Host,
            portNumber.ToString(),
            database,
            Uri.UnescapeDataString(userInfo[0]),
            userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            compatibilityOptions);
    }

    private static string BuildMySqlConnectionString(
        string host,
        string port,
        string database,
        string user,
        string password,
        LegacyHostingCompatibilityOptions compatibilityOptions)
    {
        return $"Server={host};Port={port};Database={database};User ID={user};Password={password};SslMode={compatibilityOptions.MySqlSslMode};AllowPublicKeyRetrieval={compatibilityOptions.AllowPublicKeyRetrieval};";
    }
}
