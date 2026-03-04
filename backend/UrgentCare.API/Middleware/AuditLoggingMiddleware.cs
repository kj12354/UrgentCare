using System.Diagnostics;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace UrgentCare.API.Middleware;

/// <summary>
/// HIPAA Audit Logging Middleware
///
/// WHY THIS MIDDLEWARE EXISTS:
/// HIPAA §164.312(b) requires "hardware, software, and/or procedural mechanisms that
/// record and examine activity in information systems that contain or use ePHI."
///
/// In practical terms: every HTTP request that touches patient data must be logged.
/// This middleware does that logging at the infrastructure level — ensuring NO route
/// can accidentally skip audit logging. Any request that reaches our API is logged.
///
/// WHAT WE LOG:
/// - Timestamp (UTC)
/// - Request ID (from HIPAAComplianceMiddleware)
/// - HTTP method and path (masked for PHI — see PHI masking below)
/// - Response status code
/// - User ID (from JWT claim — who made the request)
/// - Client IP address
/// - Request duration in milliseconds
///
/// WHAT WE DO NOT LOG:
/// - Request/response bodies (they contain PHI — logging PHI creates another PHI store)
/// - Query parameters that contain patient names or other direct identifiers
/// - Full URLs when they contain PHI (we mask them)
///
/// PHI MASKING:
/// URL paths often contain patient IDs (/api/patients/{id}) but not names.
/// Query strings may contain names as filters. We mask known PHI query params.
/// WHY: The audit log itself must not become a PHI store requiring encryption.
/// We log what happened (accessed patient ID X) without logging the content.
///
/// STRUCTURED LOGGING:
/// We use ILogger with structured properties (not string interpolation).
/// WHY: Structured logs can be parsed by log aggregation tools (ELK, Datadog, Splunk)
/// to generate HIPAA compliance reports: "all access to patient X in the past 30 days."
/// </summary>
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;

    // Query parameter names that may contain PHI — mask their values in logs.
    // WHY maintain this list: new PHI-containing params may be added over time.
    // Err on the side of masking — redacting non-PHI is harmless, logging PHI is not.
    private static readonly HashSet<string> PhiQueryParams = new(StringComparer.OrdinalIgnoreCase)
    {
        "name", "firstName", "lastName", "dob", "dateOfBirth", "phone",
        "email", "ssn", "mrn", "patientName", "search", "q"
    };

    // Paths that contain PHI-adjacent IDs but are safe to log as-is.
    // (The IDs are opaque CUIDs, not names or SSNs)
    private static readonly Regex PatientIdPathPattern =
        new(@"/api/patients/([a-z0-9]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        // Capture request start time for duration calculation.
        var stopwatch = Stopwatch.StartNew();

        // Retrieve request ID set by HIPAAComplianceMiddleware.
        // This links this audit log entry to the correlation ID in the response header.
        var requestId = context.Items["RequestId"]?.ToString() ?? Guid.NewGuid().ToString("N");

        // Capture the masked path BEFORE execution (path doesn't change, but good practice).
        var maskedPath = MaskPhiInPath(context.Request.Path, context.Request.QueryString.Value);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            // Extract user identity from JWT claims.
            // WHY: We must log WHO accessed PHI. The JWT is already validated by the auth
            // middleware earlier in the pipeline, so these claims are trustworthy.
            var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? context.User?.FindFirstValue("sub")
                         ?? "anonymous";

            var userRole = context.User?.FindFirstValue(ClaimTypes.Role)
                           ?? context.User?.FindFirstValue("role")
                           ?? "unknown";

            // Extract client IP.
            // WHY check X-Forwarded-For: when running behind a load balancer or reverse
            // proxy, the actual client IP is in this header, not the socket address.
            var clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                           ?? context.Connection.RemoteIpAddress?.ToString()
                           ?? "unknown";
            if (clientIp.Contains(','))
            {
                clientIp = clientIp.Split(',')[0].Trim(); // Take the first (original) IP
            }

            var statusCode = context.Response.StatusCode;

            // Log with structured properties for machine parsing.
            // The {PropertyName} placeholders in the message template create structured
            // log fields, not just a formatted string.
            _logger.LogInformation(
                "AUDIT | RequestId={RequestId} | Method={Method} | Path={Path} | " +
                "Status={StatusCode} | UserId={UserId} | Role={UserRole} | " +
                "IP={ClientIp} | Duration={DurationMs}ms",
                requestId,
                context.Request.Method,
                maskedPath,
                statusCode,
                userId,
                userRole,
                clientIp,
                stopwatch.ElapsedMilliseconds
            );

            // Log warnings for security-relevant events.
            if (statusCode == 401)
            {
                _logger.LogWarning(
                    "SECURITY | Unauthorized access attempt | RequestId={RequestId} | " +
                    "Path={Path} | IP={ClientIp}",
                    requestId, maskedPath, clientIp
                );
            }
            else if (statusCode == 403)
            {
                _logger.LogWarning(
                    "SECURITY | Forbidden access attempt | RequestId={RequestId} | " +
                    "UserId={UserId} | Role={UserRole} | Path={Path} | IP={ClientIp}",
                    requestId, userId, userRole, maskedPath, clientIp
                );
            }
        }
    }

    /// <summary>
    /// Masks PHI from URL paths and query strings before logging.
    ///
    /// WHY: URL logs can contain sensitive parameters. Masking known PHI fields
    /// prevents the audit log from becoming a secondary PHI store.
    ///
    /// Examples:
    ///   /api/patients?name=John+Doe  →  /api/patients?name=[REDACTED]
    ///   /api/patients/clyxyz123      →  /api/patients/clyxyz123  (IDs are safe)
    /// </summary>
    private static string MaskPhiInPath(PathString path, string? queryString)
    {
        if (string.IsNullOrEmpty(queryString) || queryString == "?")
            return path.Value ?? string.Empty;

        // Parse query string and mask PHI params
        var queryParts = queryString.TrimStart('?').Split('&');
        var maskedParts = queryParts.Select(part =>
        {
            var eq = part.IndexOf('=');
            if (eq < 0) return part;

            var key = part[..eq];
            var value = part[(eq + 1)..];

            // Mask the value if the key is a known PHI parameter
            return PhiQueryParams.Contains(key)
                ? $"{key}=[REDACTED]"
                : $"{key}={value}";
        });

        return path.Value + "?" + string.Join("&", maskedParts);
    }
}
