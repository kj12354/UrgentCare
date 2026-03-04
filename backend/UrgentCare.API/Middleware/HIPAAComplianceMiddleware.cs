using System.Security.Claims;

namespace UrgentCare.API.Middleware;

/// <summary>
/// HIPAA Compliance Middleware
///
/// WHY THIS MIDDLEWARE EXISTS:
/// HIPAA Technical Safeguards (45 CFR §164.312) require covered entities to implement
/// technical security measures that protect electronic PHI (ePHI) against unauthorized
/// access transmitted over electronic communications networks. This middleware enforces
/// several of those safeguards at the ASP.NET Core pipeline level.
///
/// PLACEMENT IN PIPELINE:
/// This middleware runs early in the pipeline (before routing) so that all requests —
/// including those that result in 401/403 responses — receive the security headers.
/// Security headers must be on ALL responses, not just successful ones. An attacker
/// can learn about your infrastructure from error responses.
///
/// SECURITY MEASURES IMPLEMENTED:
/// 1. Security response headers (CSP, HSTS, X-Frame-Options, etc.)
/// 2. Server fingerprint removal (prevents technology discovery)
/// 3. Request correlation ID for audit trail
/// 4. HTTPS enforcement (development-aware)
/// </summary>
public class HIPAAComplianceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<HIPAAComplianceMiddleware> _logger;

    public HIPAAComplianceMiddleware(RequestDelegate next, ILogger<HIPAAComplianceMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        // ── HTTPS Enforcement ──────────────────────────────────────────────────
        // WHY: HIPAA §164.312(e)(2)(ii) requires encryption of ePHI in transit.
        // Plain HTTP transmits data in cleartext — anyone on the network can read it.
        // We redirect HTTP to HTTPS. In development, we skip this to allow localhost.
        if (!context.Request.IsHttps && IsProduction())
        {
            var httpsUrl = "https://" + context.Request.Host + context.Request.Path + context.Request.QueryString;
            context.Response.Redirect(httpsUrl, permanent: true);
            return;
        }

        // ── Request Correlation ID ─────────────────────────────────────────────
        // WHY: Every request gets a unique ID. This ID is logged in both the request
        // and response, creating a linkable audit trail. When an incident occurs,
        // you can trace all log entries for a specific request using this ID.
        // The client also receives the ID in the response header for support purposes.
        var requestId = context.Request.Headers["X-Request-ID"].FirstOrDefault()
                        ?? Guid.NewGuid().ToString("N");
        context.Items["RequestId"] = requestId;

        // ── Remove Server Identification Headers ───────────────────────────────
        // WHY: The Server and X-Powered-By headers reveal your technology stack
        // (e.g., "Server: Kestrel", "X-Powered-By: ASP.NET"). Attackers use this
        // information to search for known vulnerabilities specific to your version.
        // Removing these headers is a "security through obscurity" measure — minor
        // benefit but zero cost.
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.Remove("Server");
            context.Response.Headers.Remove("X-Powered-By");
            context.Response.Headers.Remove("X-AspNet-Version");
            context.Response.Headers.Remove("X-AspNetMvc-Version");

            // Add the correlation ID to the response
            context.Response.Headers["X-Request-ID"] = requestId;

            // ── Security Response Headers ──────────────────────────────────────
            // These headers are equivalent to the ones set in the Next.js middleware.
            // The .NET backend serves its own API responses — these headers protect
            // against attacks targeting the API endpoints directly.

            // Prevent clickjacking — API responses should never be iframed.
            context.Response.Headers["X-Frame-Options"] = "DENY";

            // Prevent MIME sniffing — API returns JSON; browsers should not reinterpret it.
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";

            // Control referrer information to prevent PHI leakage via Referer headers.
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // HTTPS-only for 1 year.
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

            // CSP for the API: only allows same-origin requests; no scripting needed.
            context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";

            // WHY cache-control on API responses: PHI must not be cached by intermediate
            // proxies (corporate firewalls, CDNs). This header forces proxies and browsers
            // to always revalidate. Without this, a shared proxy might serve a previous
            // user's patient data to a different user.
            if (!context.Response.Headers.ContainsKey("Cache-Control"))
            {
                context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
                context.Response.Headers["Pragma"] = "no-cache";
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }

    /// <summary>
    /// Determines whether the application is running in production.
    /// WHY a separate method: allows easy testing and configuration override.
    /// </summary>
    private static bool IsProduction()
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        return string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase);
    }
}
