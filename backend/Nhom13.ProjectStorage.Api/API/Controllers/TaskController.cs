using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.API.Hubs;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;
using TaskEntity = Nhom13.ProjectStorage.Api.Domain.Entities.Task;

namespace Nhom13.ProjectStorage.Api.API.Controllers;

[ApiController]
[Route("api/projects/{projectId}/tasks")]
[Authorize]
public class TaskController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<TaskHub> _hubContext;

    public TaskController(AppDbContext context, IHubContext<TaskHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsProjectMemberAsync(int projectId) =>
        await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == CurrentUserId);

    [HttpGet]
    public async Task<IActionResult> GetTasks(int projectId)
    {
        var isMember = await IsProjectMemberAsync(projectId);
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role != "Manager" && !isMember)
            return Forbid();

        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .ToListAsync();

        var result = tasks.Select(t => new TaskDto(t.TaskId, t.ProjectId, t.Title, t.Status, t.StartDate, t.DueDate));
        return Ok(result);
    }

    [HttpGet("~/api/task/my")]
    public async Task<IActionResult> GetMyTasks()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var query = _context.Tasks
            .Include(t => t.Project)
            .AsQueryable();

        if (role != "Manager")
        {
            query = query.Where(t => t.Project.ProjectMembers.Any(pm => pm.UserId == CurrentUserId));
        }

        var tasks = await query
            .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
            .Select(t => new PersonalTaskDto(
                t.TaskId,
                t.ProjectId,
                t.Project.Name,
                t.Title,
                t.Status,
                t.StartDate,
                t.DueDate
            ))
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpGet("{taskId}")]
    public async Task<IActionResult> GetTask(int projectId, int taskId)
    {
        var isMember = await IsProjectMemberAsync(projectId);
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role != "Manager" && !isMember)
            return Forbid();

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId && t.ProjectId == projectId);
        if (task == null)
            return NotFound(new { error = "Task not found." });

        return Ok(new TaskDto(task.TaskId, task.ProjectId, task.Title, task.Status, task.StartDate, task.DueDate));
    }

    [HttpPost]
    public async Task<IActionResult> CreateTask(int projectId, [FromBody] CreateTaskRequest request)
    {
        if (!await IsProjectMemberAsync(projectId))
            return Forbid();

        var task = new TaskEntity
        {
            ProjectId = projectId,
            Title = request.Title,
            Status = request.Status,
            StartDate = request.StartDate,
            DueDate = request.DueDate
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTask), new { projectId, taskId = task.TaskId },
            new TaskDto(task.TaskId, task.ProjectId, task.Title, task.Status, task.StartDate, task.DueDate));
    }

    [HttpPut("{taskId}")]
    public async Task<IActionResult> UpdateTask(int projectId, int taskId, [FromBody] UpdateTaskRequest request)
    {
        if (!await IsProjectMemberAsync(projectId))
            return Forbid();

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId && t.ProjectId == projectId);
        if (task == null)
            return NotFound(new { error = "Task not found." });

        var previousStatus = task.Status;
        task.Title = request.Title;
        task.Status = request.Status;
        task.StartDate = request.StartDate;
        task.DueDate = request.DueDate;

        _context.Tasks.Update(task);
        await _context.SaveChangesAsync();

        // Push real-time event if status changed
        if (previousStatus != request.Status)
        {
            await _hubContext.Clients.Group(TaskHub.ProjectGroup(projectId))
                .SendAsync("TaskStatusChanged", new { taskId, projectId, oldStatus = previousStatus, newStatus = request.Status });
        }

        return Ok(new TaskDto(task.TaskId, task.ProjectId, task.Title, task.Status, task.StartDate, task.DueDate));
    }

    [HttpDelete("{taskId}")]
    public async Task<IActionResult> DeleteTask(int projectId, int taskId)
    {
        if (!await IsProjectMemberAsync(projectId))
            return Forbid();

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId && t.ProjectId == projectId);
        if (task == null)
            return NotFound(new { error = "Task not found." });

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
