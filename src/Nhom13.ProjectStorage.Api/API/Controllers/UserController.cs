using System.Security.Claims;
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
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>GET /api/user/me - Any authenticated user can view their own profile.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == CurrentUserId);

        if (user == null)
            return NotFound(new { error = "User not found." });

        return Ok(new UserProfileDto(user.UserId, user.SystemUserId, user.CompanyEmail, user.RoleId, user.Role.RoleName, user.DepartmentId, user.IsActive));
    }

    /// <summary>GET /api/user - Manager can list all users.</summary>
    [HttpGet]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.DeletedAt == null)
            .ToListAsync();

        return Ok(users.Select(u => new UserProfileDto(u.UserId, u.SystemUserId, u.CompanyEmail, u.RoleId, u.Role.RoleName, u.DepartmentId, u.IsActive)));
    }

    /// <summary>GET /api/user/{id} - Manager can view any user's profile.</summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);

        if (user == null)
            return NotFound(new { error = "User not found." });

        return Ok(new UserProfileDto(user.UserId, user.SystemUserId, user.CompanyEmail, user.RoleId, user.Role.RoleName, user.DepartmentId, user.IsActive));
    }

    /// <summary>POST /api/user - Manager adds a new user.</summary>
    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var emailTaken = await _context.Users.AnyAsync(u => u.CompanyEmail == request.CompanyEmail);
        if (emailTaken)
            return Conflict(new { error = "Email is already in use." });

        var idTaken = await _context.Users.AnyAsync(u => u.SystemUserId == request.SystemUserId);
        if (idTaken)
            return Conflict(new { error = "SystemUserId is already in use." });

        var deptExists = await _context.Departments.AnyAsync(d => d.DepartmentId == request.DepartmentId);
        if (!deptExists)
            return BadRequest(new { error = "Department not found." });

        var roleExists = await _context.Roles.AnyAsync(r => r.RoleId == request.RoleId);
        if (!roleExists)
            return BadRequest(new { error = "Role not found." });

        var user = new User
        {
            SystemUserId = request.SystemUserId,
            CompanyEmail = request.CompanyEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId = request.RoleId,
            DepartmentId = request.DepartmentId,
            MustChangePassword = true,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _context.Entry(user).Reference(u => u.Role).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.UserId },
            new UserProfileDto(user.UserId, user.SystemUserId, user.CompanyEmail, user.RoleId, user.Role.RoleName, user.DepartmentId, user.IsActive));
    }

    /// <summary>PUT /api/user/{id} - Manager updates a user.</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || user.DeletedAt != null)
            return NotFound(new { error = "User not found." });

        user.CompanyEmail = request.CompanyEmail;
        user.RoleId = request.RoleId;
        user.DepartmentId = request.DepartmentId;
        user.IsActive = request.IsActive;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        await _context.Entry(user).Reference(u => u.Role).LoadAsync();
        return Ok(new UserProfileDto(user.UserId, user.SystemUserId, user.CompanyEmail, user.RoleId, user.Role.RoleName, user.DepartmentId, user.IsActive));
    }

    /// <summary>DELETE /api/user/{id} - Manager soft-deletes a user.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || user.DeletedAt != null)
            return NotFound(new { error = "User not found." });

        user.DeletedAt = DateTime.UtcNow;
        user.IsActive = false;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
