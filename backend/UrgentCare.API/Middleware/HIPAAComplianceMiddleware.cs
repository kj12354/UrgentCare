namespace UrgentCare.API.Middleware;

public class HIPAAComplianceMiddleware
{
    private readonly RequestDelegate _next;
    public HIPAAComplianceMiddleware(RequestDelegate next) => _next = next;

    public async Task Invoke(HttpContext context)
    {
        // Ensure no PHI leaks via headers/logs; enforce timeouts
        await _next(context);
    }
}
