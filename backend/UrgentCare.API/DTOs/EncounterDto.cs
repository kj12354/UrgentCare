namespace UrgentCare.API.DTOs;

public record EncounterDto(string Id, string PatientId, DateTime StartedAt, string? Transcript, string? SoapNote, List<string> IcdCodes);
