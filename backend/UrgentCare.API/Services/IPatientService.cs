using UrgentCare.API.Models;
using UrgentCare.API.DTOs;

namespace UrgentCare.API.Services;

public interface IPatientService
{
    Task<IEnumerable<PatientDto>> GetAllAsync();
    Task<PatientDto?> GetByIdAsync(string id);
    Task<PatientDto> CreateAsync(PatientDto dto);
    Task<PatientDto?> UpdateAsync(string id, PatientDto dto);
    Task<bool> DeleteAsync(string id);
    Task<IEnumerable<PatientDto>> SearchAsync(string query);
}
