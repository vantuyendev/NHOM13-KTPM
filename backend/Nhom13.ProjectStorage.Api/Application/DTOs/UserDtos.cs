namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record UserProfileDto(int UserId, string SystemUserId, string CompanyEmail, int RoleId, string RoleName, int DepartmentId, bool IsActive, bool MustChangePassword = false);

public record UpdateMyProfileRequest(string SystemUserId, string CompanyEmail);

public record CreateUserRequest(string SystemUserId, string CompanyEmail, string Password, int RoleId, int DepartmentId);

public record UpdateUserRequest(string CompanyEmail, int RoleId, int DepartmentId, bool IsActive);
