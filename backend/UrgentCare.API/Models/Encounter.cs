namespace UrgentCare.API.Models;

public class Encounter
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PatientId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public string? Transcript { get; set; }
    public string? SoapNote { get; set; }
    public List<string> IcdCodes { get; set; } = new();
}
