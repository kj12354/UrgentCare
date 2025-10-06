using Microsoft.AspNetCore.Mvc;

namespace UrgentCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    [HttpGet("summary")]
    public IActionResult Summary() => Ok(new { encounters = 0, patients = 0 });
}
