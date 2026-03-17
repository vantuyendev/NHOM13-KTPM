namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record ProjectDto(int ProjectId, string ProjectCode, string Name, int DepartmentId, int ManagerUserId, string Status);

public record ProjectMemberDto(int UserId, string CompanyEmail, DateTime JoinedAt);

public record ProjectDetailDto(
	int ProjectId,
	string ProjectCode,
	string Name,
	int DepartmentId,
	int ManagerUserId,
	string Status,
	IReadOnlyList<ProjectMemberDto> ProjectMembers
);

public record CreateProjectRequest(string ProjectCode, string Name, int DepartmentId, int ManagerUserId, string Status);

public record UpdateProjectRequest(string Name, int DepartmentId, int ManagerUserId, string Status);
