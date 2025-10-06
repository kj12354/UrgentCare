namespace UrgentCare.API.Middleware;

public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    public AuditLoggingMiddleware(RequestDelegate next) => _next = next;

    public async Task Invoke(HttpContext context)
    {
        // Minimal placeholder: in real impl, record masked PHI audit
        await _next(context);
    }
}
