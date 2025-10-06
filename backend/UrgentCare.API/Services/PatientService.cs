using Microsoft.EntityFrameworkCore;
using UrgentCare.API.Data;
using UrgentCare.API.Models;
using UrgentCare.API.DTOs;

namespace UrgentCare.API.Services;

public class PatientService : IPatientService
{
    private readonly ApplicationDbContext _context;
    private readonly AuditService _auditService;

    public PatientService(ApplicationDbContext context, AuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    public async Task<IEnumerable<PatientDto>> GetAllAsync()
    {
        var patients = await _context.Patients
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync();

        return patients.Select(MapToDto);
    }

    public async Task<PatientDto?> GetByIdAsync(string id)
    {
        var patient = await _context.Patients.FindAsync(id);
        return patient == null ? null : MapToDto(patient);
    }

    public async Task<PatientDto> CreateAsync(PatientDto dto)
    {
        var patient = new Patient
        {
            Id = Guid.NewGuid().ToString(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Dob = dto.Dob,
            Phone = dto.Phone
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("CREATE", "Patient", patient.Id);

        return MapToDto(patient);
    }

    public async Task<PatientDto?> UpdateAsync(string id, PatientDto dto)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return null;

        patient.FirstName = dto.FirstName;
        patient.LastName = dto.LastName;
        patient.Dob = dto.Dob;
        patient.Phone = dto.Phone;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync("UPDATE", "Patient", patient.Id);

        return MapToDto(patient);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null) return false;

        _context.Patients.Remove(patient);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("DELETE", "Patient", id);

        return true;
    }

    public async Task<IEnumerable<PatientDto>> SearchAsync(string query)
    {
        var lowerQuery = query.ToLower();
        var patients = await _context.Patients
            .Where(p => 
                p.FirstName.ToLower().Contains(lowerQuery) ||
                p.LastName.ToLower().Contains(lowerQuery) ||
                (p.Phone != null && p.Phone.Contains(query)))
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .Take(50)
            .ToListAsync();

        return patients.Select(MapToDto);
    }

    private static PatientDto MapToDto(Patient patient) => new(
        patient.Id,
        patient.FirstName,
        patient.LastName,
        patient.Dob,
        patient.Phone
    );
}
