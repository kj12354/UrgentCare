using UrgentCare.API.Models;

namespace UrgentCare.API.Services;

public class EncounterService : IEncounterService
{
    public Task<IEnumerable<Encounter>> GetAsync() => Task.FromResult(Enumerable.Empty<Encounter>());
}
