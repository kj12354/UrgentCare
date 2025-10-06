using UrgentCare.API.Models;

namespace UrgentCare.API.Services;

public interface IAIService
{
    Task<SOAPNote> GenerateSoapAsync(string transcript);
}
