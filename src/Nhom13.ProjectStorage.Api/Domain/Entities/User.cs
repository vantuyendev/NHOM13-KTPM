namespace Nhom13.ProjectStorage.Api.Domain.Entities;

public class User
{
    public int UserId { get; set; }
    public string SystemUserId { get; set; } = string.Empty;
    public string CompanyEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public int DepartmentId { get; set; }

    public bool MustChangePassword { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? DeletedAt { get; set; }

    public Department? Department { get; set; }

    public ICollection<Project> ManagedProjects { get; set; } = new List<Project>();
    public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
    public ICollection<TaskComment> TaskComments { get; set; } = new List<TaskComment>();
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
}
