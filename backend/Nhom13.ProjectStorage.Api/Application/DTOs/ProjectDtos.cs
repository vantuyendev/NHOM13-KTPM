namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record ProjectDto(int ProjectId, string ProjectCode, string Name, int DepartmentId, int ManagerUserId, string Status);

public record CreateProjectRequest(string ProjectCode, string Name, int DepartmentId, int ManagerUserId, string Status);

public record UpdateProjectRequest(string Name, int DepartmentId, int ManagerUserId, string Status);
