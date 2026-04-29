namespace Checklist.Api.Controllers.Features.Supervisor.Common;

public sealed record SupervisorOperationResult<T>
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? ErrorMessage { get; init; }
    public T? Value { get; init; }

    public static SupervisorOperationResult<T> Ok(T value) => new()
    {
        Success = true,
        StatusCode = StatusCodes.Status200OK,
        Value = value
    };

    public static SupervisorOperationResult<T> Fail(int statusCode, string errorMessage) => new()
    {
        Success = false,
        StatusCode = statusCode,
        ErrorMessage = errorMessage
    };
}
