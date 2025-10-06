namespace UrgentCare.API.Models;

public class Prescription
{
    public string Drug { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
}
