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
public class DocumentController : ControllerBase
{
    private readonly AppDbContext _context;
    private const long MaxInternalSizeBytes = 20L * 1024 * 1024; // 20 MB

    public DocumentController(AppDbContext context)
    {
        _context = context;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsProjectMemberAsync(int projectId) =>
        await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == CurrentUserId);

    [HttpGet("project/{projectId}")]
    public async Task<IActionResult> GetDocumentsByProject(int projectId)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role != "Manager" && !await IsProjectMemberAsync(projectId))
            return Forbid();

        var docs = await _context.Documents
            .Where(d => d.ProjectId == projectId)
            .ToListAsync();

        return Ok(docs.Select(MapToDto));
    }

    [HttpGet("{documentId}")]
    public async Task<IActionResult> GetDocument(int documentId)
    {
        var doc = await _context.Documents.FindAsync(documentId);
        if (doc == null)
            return NotFound(new { error = "Document not found." });

        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role != "Manager" && !await IsProjectMemberAsync(doc.ProjectId))
            return Forbid();

        return Ok(MapToDto(doc));
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromBody] UploadDocumentRequest request)
    {
        if (!await IsProjectMemberAsync(request.ProjectId))
            return Forbid();

        // Validate project exists
        var projectExists = await _context.Projects.AnyAsync(p => p.ProjectId == request.ProjectId);
        if (!projectExists)
            return NotFound(new { error = "Project not found." });

        // Validate task belongs to project if provided
        if (request.TaskId.HasValue)
        {
            var taskExists = await _context.Tasks
                .AnyAsync(t => t.TaskId == request.TaskId && t.ProjectId == request.ProjectId);
            if (!taskExists)
                return BadRequest(new { error = "Task does not belong to the specified project." });
        }

        Document document;

        if (request.FileSizeBytes <= MaxInternalSizeBytes)
        {
            // Store internally
            var internalPath = $"/storage/projects/{request.ProjectId}/{Guid.NewGuid()}";
            document = new Document
            {
                ProjectId = request.ProjectId,
                TaskId = request.TaskId,
                StorageType = "Internal",
                FileSizeBytes = request.FileSizeBytes,
                InternalPath = internalPath,
                CloudUrl = null
            };
        }
        else
        {
            // File > 20MB: require client to provide CloudUrl
            if (string.IsNullOrWhiteSpace(request.CloudUrl))
            {
                return BadRequest(new
                {
                    error = "File size exceeds 20MB. Please provide a CloudUrl for cloud storage.",
                    requiredAction = "PROVIDE_CLOUD_URL"
                });
            }

            document = new Document
            {
                ProjectId = request.ProjectId,
                TaskId = request.TaskId,
                StorageType = "CloudLink",
                FileSizeBytes = request.FileSizeBytes,
                InternalPath = null,
                CloudUrl = request.CloudUrl
            };
        }

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDocument), new { documentId = document.DocumentId }, MapToDto(document));
    }

    [HttpDelete("{documentId}")]
    public async Task<IActionResult> DeleteDocument(int documentId)
    {
        var doc = await _context.Documents.FindAsync(documentId);
        if (doc == null)
            return NotFound(new { error = "Document not found." });

        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role != "Manager" && !await IsProjectMemberAsync(doc.ProjectId))
            return Forbid();

        _context.Documents.Remove(doc);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static DocumentDto MapToDto(Document d) =>
        new(d.DocumentId, d.ProjectId, d.TaskId, d.StorageType, d.FileSizeBytes, d.InternalPath, d.CloudUrl);
}
