namespace Checklist.Api.Support;

public static class BusinessDate
{
    private static readonly TimeZoneInfo SaoPauloTimeZone = ResolveTimeZone();

    public static DateTimeOffset NowLocal()
    {
        return TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, SaoPauloTimeZone);
    }

    public static DateTime TodayKeyUtc()
    {
        var localNow = NowLocal();
        return new DateTime(localNow.Year, localNow.Month, localNow.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    public static DateTime ToDateKeyUtc(DateTime utcDateTime)
    {
        var local = TimeZoneInfo.ConvertTime(new DateTimeOffset(utcDateTime, TimeSpan.Zero), SaoPauloTimeZone);
        return new DateTime(local.Year, local.Month, local.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    private static TimeZoneInfo ResolveTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        }
    }
}
