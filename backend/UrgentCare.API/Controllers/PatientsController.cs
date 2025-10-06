using Microsoft.AspNetCore.Mvc;
using UrgentCare.API.Services;
using UrgentCare.API.DTOs;

namespace UrgentCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientsController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    /// <summary>
    /// Get all patients
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PatientDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var patients = await _patientService.GetAllAsync();
        return Ok(patients);
    }

    /// <summary>
    /// Get patient by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PatientDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(string id)
    {
        var patient = await _patientService.GetByIdAsync(id);
        if (patient == null)
            return NotFound(new { error = "Patient not found" });

        return Ok(patient);
    }

    /// <summary>
    /// Search patients by name or phone
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<PatientDto>), 200)]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { error = "Search query is required" });

        var patients = await _patientService.SearchAsync(q);
        return Ok(patients);
    }

    /// <summary>
    /// Create a new patient
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PatientDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] PatientDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var patient = await _patientService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, patient);
    }

    /// <summary>
    /// Update an existing patient
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(PatientDto), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Update(string id, [FromBody] PatientDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var patient = await _patientService.UpdateAsync(id, dto);
        if (patient == null)
            return NotFound(new { error = "Patient not found" });

        return Ok(patient);
    }

    /// <summary>
    /// Delete a patient
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _patientService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { error = "Patient not found" });

        return NoContent();
    }
}
