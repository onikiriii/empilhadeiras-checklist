using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Checklist.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Checklist.Api.Security;

public class SupervisorLoginGenerator
{
    private static readonly Regex NonAlphaNumericRegex = new("[^a-zA-Z0-9]", RegexOptions.Compiled);
    private readonly AppDbContext _db;

    public SupervisorLoginGenerator(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateUniqueLoginAsync(
        string nome,
        string sobrenome,
        Guid? excludeSupervisorId = null,
        CancellationToken cancellationToken = default)
    {
        var baseLogin = NormalizeToLogin($"{nome}{sobrenome}");
        if (string.IsNullOrWhiteSpace(baseLogin))
            baseLogin = "Supervisor";

        var candidate = baseLogin;
        var suffix = 2;

        while (await _db.UsuariosSupervisores.AnyAsync(
            x => x.Login == candidate && (!excludeSupervisorId.HasValue || x.Id != excludeSupervisorId.Value),
            cancellationToken))
        {
            candidate = $"{baseLogin}{suffix}";
            suffix++;
        }

        return candidate;
    }

    public static string NormalizeToLogin(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var ch in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category != UnicodeCategory.NonSpacingMark)
                builder.Append(ch);
        }

        var withoutAccents = builder.ToString().Normalize(NormalizationForm.FormC);
        return NonAlphaNumericRegex.Replace(withoutAccents, string.Empty);
    }
}
