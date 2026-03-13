namespace Nhom13.ProjectStorage.Api.Domain.Entities;

public class Project
{
    public int ProjectId { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int DepartmentId { get; set; }

    public int ManagerUserId { get; set; }
    public User Manager { get; set; } = null!;

    public string Status { get; set; } = string.Empty;

    public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
