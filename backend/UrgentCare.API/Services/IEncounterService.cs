using UrgentCare.API.Models;

namespace UrgentCare.API.Services;

public interface IEncounterService
{
    Task<IEnumerable<Encounter>> GetAsync();
}
