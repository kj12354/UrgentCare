namespace UrgentCare.API.DTOs;

public record PatientDto(string Id, string FirstName, string LastName, DateTime Dob, string? Phone);
