namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record LoginRequest(string CompanyEmail, string Password);

public record LoginResponse(string Token, bool MustChangePassword);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record ForgotPasswordRequest(string CompanyEmail);

public record ResetPasswordRequest(string Token, string NewPassword);
