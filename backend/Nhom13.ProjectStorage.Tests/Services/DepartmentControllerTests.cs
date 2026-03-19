using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.API.Controllers;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;
using TaskEntity = Nhom13.ProjectStorage.Api.Domain.Entities.Task;

namespace Nhom13.ProjectStorage.Tests.Services;

public class DepartmentControllerTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        // Seed initial data
        var role = new Role { RoleId = 1, RoleName = "Manager" };
        context.Roles.Add(role);
        context.SaveChanges();

        return context;
    }

    [Fact]
    public async Task Delete_Department_WithNoActiveUsers_ShouldSucceed()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var controller = new DepartmentController(context);
        var dept = new Department { Name = "Test Department" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        // Act
        var result = await controller.Delete(dept.DepartmentId);

        // Assert
        var deletedDept = await context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == dept.DepartmentId);
        Assert.NotNull(deletedDept?.DeletedAt);
    }

    [Fact]
    public async Task Delete_Department_WithActiveUsers_ShouldFail()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var controller = new DepartmentController(context);
        var dept = new Department { Name = "Test Department" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var role = context.Roles.First();
        var user = new User
        {
            SystemUserId = "user1",
            CompanyEmail = "user1@test.com",
            PasswordHash = "hash",
            RoleId = role.RoleId,
            DepartmentId = dept.DepartmentId
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        var result = await controller.Delete(dept.DepartmentId);

        // Assert
        var conflictResult = Assert.IsType<Microsoft.AspNetCore.Mvc.ConflictObjectResult>(result);
        Assert.NotNull(conflictResult);
        var dept_check = await context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == dept.DepartmentId);
        Assert.Null(dept_check?.DeletedAt); // Should still be active
    }

    [Fact]
    public async Task Delete_Department_WithSoftDeletedUsers_ShouldSucceed()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var controller = new DepartmentController(context);
        var dept = new Department { Name = "Test Department" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var role = context.Roles.First();
        var user = new User
        {
            SystemUserId = "user1",
            CompanyEmail = "user1@test.com",
            PasswordHash = "hash",
            RoleId = role.RoleId,
            DepartmentId = dept.DepartmentId,
            DeletedAt = DateTime.UtcNow  // Soft-deleted
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        var result = await controller.Delete(dept.DepartmentId);

        // Assert
        var deletedDept = await context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == dept.DepartmentId);
        Assert.NotNull(deletedDept?.DeletedAt); // Department should be soft-deleted
    }

    [Fact]
    public async Task GetAll_ShouldExcludeSoftDeletedDepartments()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var controller = new DepartmentController(context);
        var activeDept = new Department { Name = "Active Dept" };
        var deletedDept = new Department { Name = "Deleted Dept", DeletedAt = DateTime.UtcNow };
        context.Departments.AddRange(activeDept, deletedDept);
        await context.SaveChangesAsync();

        // Act
        var result = await controller.GetAll();

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var departments = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.Single(departments);
    }
}
