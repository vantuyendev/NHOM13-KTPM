namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record DepartmentDto(int DepartmentId, string Name, string? Description);

public record CreateDepartmentRequest(string Name, string? Description);

public record UpdateDepartmentRequest(string Name, string? Description);
