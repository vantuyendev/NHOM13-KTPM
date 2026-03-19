using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;

namespace Nhom13.ProjectStorage.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentController : ControllerBase
{
    private readonly AppDbContext _context;

    public DepartmentController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departments = await _context.Departments.Where(d => d.DeletedAt == null).ToListAsync();
        return Ok(departments.Select(d => new DepartmentDto(d.DepartmentId, d.Name, d.Description)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var department = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == id && d.DeletedAt == null);
        if (department == null)
            return NotFound(new { error = "Department not found." });

        return Ok(new DepartmentDto(department.DepartmentId, department.Name, department.Description));
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request)
    {
        var department = new Department
        {
            Name = request.Name,
            Description = request.Description
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = department.DepartmentId },
            new DepartmentDto(department.DepartmentId, department.Name, department.Description));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentRequest request)
    {
        var department = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == id && d.DeletedAt == null);
        if (department == null)
            return NotFound(new { error = "Department not found." });

        department.Name = request.Name;
        department.Description = request.Description;

        _context.Departments.Update(department);
        await _context.SaveChangesAsync();

        return Ok(new DepartmentDto(department.DepartmentId, department.Name, department.Description));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var department = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == id && d.DeletedAt == null);
        if (department == null)
            return NotFound(new { error = "Department not found." });

        // Check for active users assigned to this department
        var hasActiveUsers = await _context.Users.AnyAsync(u => u.DepartmentId == id && u.DeletedAt == null);
        if (hasActiveUsers)
            return Conflict(new { error = "Không thể xóa phòng ban do vẫn còn nhân viên." });

        // Soft-delete the department
        department.DeletedAt = DateTime.UtcNow;
        _context.Departments.Update(department);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
