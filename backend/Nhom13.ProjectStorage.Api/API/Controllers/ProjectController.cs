using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;
using Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

namespace Nhom13.ProjectStorage.Api.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProjectController(IUnitOfWork uow, AppDbContext context, IWebHostEnvironment env)
    {
        _uow = uow;
        _context = context;
        _env = env;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        IEnumerable<Project> projects;

        if (CurrentRole == "Manager")
        {
            projects = await _uow.Projects.GetAllAsync();
        }
        else
        {
            projects = await _uow.Projects.GetProjectsForMemberAsync(CurrentUserId);
        }

        var result = projects.Select(p => new ProjectDto(p.ProjectId, p.ProjectCode, p.Name, p.DepartmentId, p.ManagerUserId, p.Status));
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(int id)
    {
        var project = await _uow.Projects.GetProjectWithMembersAsync(id);
        if (project == null)
            return NotFound(new { error = "Project not found." });

        if (CurrentRole != "Manager" && !project.ProjectMembers.Any(pm => pm.UserId == CurrentUserId))
            return Forbid();

        var members = project.ProjectMembers
            .Select(pm => new ProjectMemberDto(pm.UserId, pm.User.CompanyEmail, pm.JoinedAt))
            .ToList();

        return Ok(new ProjectDetailDto(
            project.ProjectId,
            project.ProjectCode,
            project.Name,
            project.DepartmentId,
            project.ManagerUserId,
            project.Status,
            members
        ));
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        var existing = await _uow.Projects.FirstOrDefaultAsync(p => p.ProjectCode == request.ProjectCode);
        if (existing != null)
            return Conflict(new { error = "ProjectCode already exists." });

        var project = new Project
        {
            ProjectCode = request.ProjectCode,
            Name = request.Name,
            DepartmentId = request.DepartmentId,
            ManagerUserId = request.ManagerUserId,
            Status = request.Status
        };

        await _uow.Projects.AddAsync(project);
        await _uow.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProject), new { id = project.ProjectId },
            new ProjectDto(project.ProjectId, project.ProjectCode, project.Name, project.DepartmentId, project.ManagerUserId, project.Status));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
    {
        var project = await _uow.Projects.GetByIdAsync(id);
        if (project == null)
            return NotFound(new { error = "Project not found." });

        project.Name = request.Name;
        project.DepartmentId = request.DepartmentId;
        project.ManagerUserId = request.ManagerUserId;
        project.Status = request.Status;

        _uow.Projects.Update(project);
        await _uow.SaveChangesAsync();

        return Ok(new ProjectDto(project.ProjectId, project.ProjectCode, project.Name, project.DepartmentId, project.ManagerUserId, project.Status));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var project = await _uow.Projects.GetByIdAsync(id);
        if (project == null)
            return NotFound(new { error = "Project not found." });

        _uow.Projects.Remove(project);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{projectId}/members/{userId}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> AddMember(int projectId, int userId)
    {
        try
        {
            var project = await _uow.Projects.GetProjectWithMembersAsync(projectId);
            if (project == null)
                return NotFound(new { error = "Project not found." });

            var userExists = await _context.Users.AnyAsync(u => u.UserId == userId && u.DeletedAt == null);
            if (!userExists)
                return NotFound(new { error = "User not found." });

            if (project.ProjectMembers.Any(pm => pm.UserId == userId))
                return Conflict(new { error = "User is already a member of this project." });

            var member = new ProjectMember
            {
                ProjectId = projectId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            };

            _context.ProjectMembers.Add(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member added successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = "Failed to add member.", detail = ex.Message });
        }
    }

    [HttpDelete("{projectId}/members/{userId}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> RemoveMember(int projectId, int userId)
    {
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);
        if (member == null)
            return NotFound(new { error = "Member not found in project." });

        _context.ProjectMembers.Remove(member);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// GET /api/project/{id}/download - Generates a zip containing project info JSON
    /// and any internally stored documents for that project.
    /// </summary>
    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadProjectAsZip(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Manager)
            .Include(p => p.ProjectMembers).ThenInclude(pm => pm.User)
            .Include(p => p.Tasks)
            .Include(p => p.Documents)
            .FirstOrDefaultAsync(p => p.ProjectId == id);

        if (project == null)
            return NotFound(new { error = "Project not found." });

        // Access control: Manager sees all; Member must belong to project
        if (CurrentRole != "Manager" && !project.ProjectMembers.Any(pm => pm.UserId == CurrentUserId))
            return Forbid();

        using var memStream = new MemoryStream();
        using (var archive = new ZipArchive(memStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            // --- project-info.json ---
            var projectInfo = new
            {
                project.ProjectId,
                project.ProjectCode,
                project.Name,
                project.DepartmentId,
                project.Status,
                Manager = project.Manager?.CompanyEmail,
                Members = project.ProjectMembers.Select(pm => new { pm.UserId, pm.User.CompanyEmail, pm.JoinedAt }),
                Tasks = project.Tasks.Select(t => new { t.TaskId, t.Title, t.Status, t.StartDate, t.DueDate })
            };

            var json = JsonSerializer.Serialize(projectInfo, new JsonSerializerOptions { WriteIndented = true });
            var infoEntry = archive.CreateEntry("project-info.json", CompressionLevel.Fastest);
            using (var entryStream = infoEntry.Open())
            {
                var bytes = Encoding.UTF8.GetBytes(json);
                await entryStream.WriteAsync(bytes);
            }

            // --- internal documents ---
            var internalDocs = project.Documents
                .Where(d => d.StorageType == "Internal" && !string.IsNullOrEmpty(d.InternalPath))
                .ToList();

            foreach (var doc in internalDocs)
            {
                var absolutePath = Path.Combine(_env.ContentRootPath, doc.InternalPath!.TrimStart('/'));
                var entryName = $"documents/{doc.DocumentId}_{Path.GetFileName(doc.InternalPath)}";

                if (System.IO.File.Exists(absolutePath))
                {
                    archive.CreateEntryFromFile(absolutePath, entryName, CompressionLevel.Fastest);
                }
                else
                {
                    // File doesn't exist on disk — write a placeholder note
                    var placeholder = archive.CreateEntry(entryName + ".missing.txt", CompressionLevel.Fastest);
                    using var ps = placeholder.Open();
                    var note = Encoding.UTF8.GetBytes($"File not found on server: {doc.InternalPath}");
                    await ps.WriteAsync(note);
                }
            }

            // --- cloud-links.txt ---
            var cloudDocs = project.Documents.Where(d => d.StorageType == "CloudLink").ToList();
            if (cloudDocs.Count > 0)
            {
                var linksEntry = archive.CreateEntry("documents/cloud-links.txt", CompressionLevel.Fastest);
                using var ls = linksEntry.Open();
                foreach (var doc in cloudDocs)
                {
                    var line = Encoding.UTF8.GetBytes($"DocumentId={doc.DocumentId} | {doc.CloudUrl}\n");
                    await ls.WriteAsync(line);
                }
            }
        }

        memStream.Seek(0, SeekOrigin.Begin);
        var fileName = $"project-{project.ProjectCode}-{DateTime.UtcNow:yyyyMMddHHmmss}.zip";
        return File(memStream.ToArray(), "application/zip", fileName);
    }
}
