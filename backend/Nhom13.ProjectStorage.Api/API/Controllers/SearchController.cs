using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;

namespace Nhom13.ProjectStorage.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _context;

    public SearchController(AppDbContext context)
    {
        _context = context;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string keyword)
    {
        var term = keyword?.Trim();
        if (string.IsNullOrWhiteSpace(term))
        {
            return Ok(new
            {
                projects = Array.Empty<ProjectDto>(),
                users = Array.Empty<UserProfileDto>(),
                documents = Array.Empty<DocumentDto>()
            });
        }

        var loweredTerm = term.ToLower();

        var projectsQuery = _context.Projects.AsQueryable();
        if (CurrentRole != "Manager")
        {
            projectsQuery = projectsQuery.Where(p => p.ProjectMembers.Any(pm => pm.UserId == CurrentUserId));
        }

        var projects = await projectsQuery
            .Where(p =>
                EF.Functions.Like(p.Name.ToLower(), $"%{loweredTerm}%") ||
                EF.Functions.Like(p.ProjectCode.ToLower(), $"%{loweredTerm}%"))
            .OrderBy(p => p.Name)
            .Take(8)
            .Select(p => new ProjectDto(p.ProjectId, p.ProjectCode, p.Name, p.DepartmentId, p.ManagerUserId, p.Status))
            .ToListAsync();

        var usersQuery = _context.Users
            .Include(u => u.Role)
            .Where(u => u.DeletedAt == null && u.IsActive)
            .AsQueryable();

        var users = await usersQuery
            .Where(u =>
                EF.Functions.Like(u.CompanyEmail.ToLower(), $"%{loweredTerm}%") ||
                EF.Functions.Like(u.SystemUserId.ToLower(), $"%{loweredTerm}%"))
            .OrderBy(u => u.CompanyEmail)
            .Take(8)
            .Select(u => new UserProfileDto(
                u.UserId,
                u.SystemUserId,
                u.CompanyEmail,
                u.RoleId,
                u.Role.RoleName,
                u.DepartmentId,
                u.IsActive
            ))
            .ToListAsync();

        var documentsQuery = _context.Documents.AsQueryable();
        if (CurrentRole != "Manager")
        {
            documentsQuery = documentsQuery.Where(d => d.Project.ProjectMembers.Any(pm => pm.UserId == CurrentUserId));
        }

        var documents = await documentsQuery
            .Where(d =>
                (d.InternalPath != null && EF.Functions.Like(d.InternalPath.ToLower(), $"%{loweredTerm}%")) ||
                (d.CloudUrl != null && EF.Functions.Like(d.CloudUrl.ToLower(), $"%{loweredTerm}%")) ||
                EF.Functions.Like(d.StorageType.ToLower(), $"%{loweredTerm}%"))
            .OrderByDescending(d => d.DocumentId)
            .Take(8)
            .Select(d => new DocumentDto(
                d.DocumentId,
                d.ProjectId,
                d.TaskId,
                d.StorageType,
                d.FileSizeBytes,
                d.InternalPath,
                d.CloudUrl
            ))
            .ToListAsync();

        return Ok(new { projects, users, documents });
    }
}
