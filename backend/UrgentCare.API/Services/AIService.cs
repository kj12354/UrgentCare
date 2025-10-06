using UrgentCare.API.Models;

namespace UrgentCare.API.Services;

public class AIService : IAIService
{
    public Task<SOAPNote> GenerateSoapAsync(string transcript)
        => Task.FromResult(new SOAPNote());
}
