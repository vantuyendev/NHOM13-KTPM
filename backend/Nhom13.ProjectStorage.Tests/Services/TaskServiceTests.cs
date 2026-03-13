using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Nhom13.ProjectStorage.Api.API.Controllers;
using Nhom13.ProjectStorage.Api.API.Hubs;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;
using TaskEntity = Nhom13.ProjectStorage.Api.Domain.Entities.Task;

namespace Nhom13.ProjectStorage.Tests.Services;

public class TaskServiceTests
{
    [Fact]
    public async global::System.Threading.Tasks.Task UpdateTask_UserNotInProjectMembers_ReturnsForbid()
    {
        await using var context = CreateContext();

        var role = new Role { RoleId = 2, RoleName = "Member" };
        var manager = new User
        {
            UserId = 1,
            SystemUserId = "MGR001",
            CompanyEmail = "manager@company.com",
            PasswordHash = "hash",
            RoleId = 2,
            MustChangePassword = false,
            IsActive = true
        };
        var outsider = new User
        {
            UserId = 99,
            SystemUserId = "OUT001",
            CompanyEmail = "outsider@company.com",
            PasswordHash = "hash",
            RoleId = 2,
            MustChangePassword = false,
            IsActive = true
        };

        var project = new Project
        {
            ProjectId = 10,
            ProjectCode = "P10",
            Name = "Project 10",
            DepartmentId = 1,
            ManagerUserId = manager.UserId,
            Status = "Active"
        };

        var task = new TaskEntity
        {
            TaskId = 7,
            ProjectId = project.ProjectId,
            Title = "Initial Task",
            Status = "To Do"
        };

        context.Roles.Add(role);
        context.Users.AddRange(manager, outsider);
        context.Projects.Add(project);
        context.Tasks.Add(task);
        await context.SaveChangesAsync();

        var hubContextMock = new Mock<IHubContext<TaskHub>>();
        var controller = new TaskController(context, hubContextMock.Object)
        {
            ControllerContext = BuildControllerContext(userId: outsider.UserId, role: "Member")
        };

        var request = new UpdateTaskRequest(
            Title: "Edited by outsider",
            Status: "Done",
            StartDate: null,
            DueDate: DateTime.UtcNow.AddDays(1)
        );

        var result = await controller.UpdateTask(project.ProjectId, task.TaskId, request);

        Assert.IsType<ForbidResult>(result);

        var persisted = await context.Tasks.SingleAsync(t => t.TaskId == task.TaskId);
        Assert.Equal("Initial Task", persisted.Title);
        Assert.Equal("To Do", persisted.Status);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static ControllerContext BuildControllerContext(int userId, string role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }
}
