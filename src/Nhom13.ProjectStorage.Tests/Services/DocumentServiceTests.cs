using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.API.Controllers;
using Nhom13.ProjectStorage.Api.Application.DTOs;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;

namespace Nhom13.ProjectStorage.Tests.Services;

public class DocumentServiceTests
{
    [Fact]
    public async global::System.Threading.Tasks.Task Upload_FileGreaterThan20MB_WithoutCloudUrl_ReturnsBadRequestFailure()
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
        var member = new User
        {
            UserId = 2,
            SystemUserId = "MEM001",
            CompanyEmail = "member@company.com",
            PasswordHash = "hash",
            RoleId = 2,
            MustChangePassword = false,
            IsActive = true
        };

        var project = new Project
        {
            ProjectId = 100,
            ProjectCode = "P100",
            Name = "Storage",
            DepartmentId = 1,
            ManagerUserId = manager.UserId,
            Status = "Active"
        };

        context.Roles.Add(role);
        context.Users.AddRange(manager, member);
        context.Projects.Add(project);
        context.ProjectMembers.Add(new ProjectMember { ProjectId = project.ProjectId, UserId = member.UserId });
        await context.SaveChangesAsync();

        var controller = new DocumentController(context)
        {
            ControllerContext = BuildControllerContext(userId: member.UserId, role: "Member")
        };

        var request = new UploadDocumentRequest(
            ProjectId: project.ProjectId,
            TaskId: null,
            FileSizeBytes: 21L * 1024 * 1024,
            CloudUrl: null
        );

        var result = await controller.Upload(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        var payloadText = badRequest.Value?.ToString() ?? string.Empty;
        Assert.Contains("CloudUrl", payloadText, StringComparison.OrdinalIgnoreCase);
        Assert.Empty(context.Documents);
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
