namespace Checklist.Api.Controllers.Features.Supervisor.NaoOk;

public static class SupervisorNaoOkFormattingHelper
{
    public static string DescribeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? "\"-\"" : $"\"{value}\"";
    }

    public static string FormatHistoryDate(DateTime? value)
    {
        return value is null ? "-" : value.Value.ToString("dd/MM/yyyy");
    }

    public static DateTime? NormalizeDateOnly(DateTime? value)
    {
        if (value is null)
            return null;

        var utc = value.Value.Kind == DateTimeKind.Utc
            ? value.Value
            : value.Value.ToUniversalTime();

        return new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    public static int NormalizePercentualConclusao(int value)
    {
        return Math.Clamp(value, 0, 100);
    }

    public static string? NormalizeOptionalText(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }
}
