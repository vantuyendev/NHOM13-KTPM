using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Nhom13.ProjectStorage.Api.API.Hubs;

[Authorize]
public class TaskHub : Hub
{
    /// <summary>
    /// Client calls this to join the SignalR group for a specific project's tasks.
    /// </summary>
    public async System.Threading.Tasks.Task JoinProjectGroup(int projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ProjectGroup(projectId));
    }

    /// <summary>
    /// Client calls this to leave the group.
    /// </summary>
    public async System.Threading.Tasks.Task LeaveProjectGroup(int projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ProjectGroup(projectId));
    }

    public static string ProjectGroup(int projectId) => $"project-{projectId}";
}
