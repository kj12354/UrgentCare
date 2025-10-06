using UrgentCare.API.Data;
using UrgentCare.API.Models;

namespace UrgentCare.API.Services;

public class AuditService
{
    private readonly ApplicationDbContext _context;

    public AuditService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string action, string entity, string? entityId = null, string? userId = null, string? ip = null)
    {
        var log = new AuditLog
        {
            Action = action,
            Entity = entity,
            EntityId = entityId,
            UserId = userId,
            Ip = ip,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
