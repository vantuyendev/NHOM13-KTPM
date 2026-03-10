using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.API.Hubs;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;

namespace Nhom13.ProjectStorage.Api.API.Controllers;

[ApiController]
[Route("api/projects/{projectId}/tasks/{taskId}/comments")]
[Authorize]
public class CommentController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<TaskHub> _hubContext;

    public CommentController(AppDbContext context, IHubContext<TaskHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsProjectMemberAsync(int projectId) =>
        await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == CurrentUserId)
        || User.IsInRole("Manager");

    [HttpGet]
    public async Task<IActionResult> GetComments(int projectId, int taskId)
    {
        if (!await IsProjectMemberAsync(projectId))
            return Forbid();

        var comments = await _context.TaskComments
            .Include(c => c.User)
            .Where(c => c.TaskId == taskId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Ok(comments.Select(c => new CommentDto(c.CommentId, c.TaskId, c.UserId, c.User.CompanyEmail, c.Content, c.CreatedAt)));
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(int projectId, int taskId, [FromBody] AddCommentRequest request)
    {
        if (!await IsProjectMemberAsync(projectId))
            return Forbid();

        var taskExists = await _context.Tasks
            .AnyAsync(t => t.TaskId == taskId && t.ProjectId == projectId);
        if (!taskExists)
            return NotFound(new { error = "Task not found." });

        var user = await _context.Users.FindAsync(CurrentUserId);
        if (user == null)
            return Unauthorized();

        var comment = new TaskComment
        {
            TaskId = taskId,
            UserId = CurrentUserId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };

        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync();

        var dto = new CommentDto(comment.CommentId, comment.TaskId, comment.UserId, user.CompanyEmail, comment.Content, comment.CreatedAt);

        // Push real-time event to project group
        await _hubContext.Clients.Group(TaskHub.ProjectGroup(projectId))
            .SendAsync("CommentAdded", dto);

        return CreatedAtAction(nameof(GetComments), new { projectId, taskId }, dto);
    }

    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(int projectId, int taskId, int commentId)
    {
        var comment = await _context.TaskComments
            .FirstOrDefaultAsync(c => c.CommentId == commentId && c.TaskId == taskId);
        if (comment == null)
            return NotFound(new { error = "Comment not found." });

        // Only the author or a Manager can delete
        if (comment.UserId != CurrentUserId && !User.IsInRole("Manager"))
            return Forbid();

        _context.TaskComments.Remove(comment);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group(TaskHub.ProjectGroup(projectId))
            .SendAsync("CommentDeleted", new { commentId, taskId });

        return NoContent();
    }
}
