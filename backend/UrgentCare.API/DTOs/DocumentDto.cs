namespace UrgentCare.API.DTOs;

public record DocumentDto(string Id, string PatientId, string S3Key, string MimeType, DateTime CreatedAt);
