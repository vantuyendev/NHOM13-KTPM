namespace Nhom13.ProjectStorage.Api.Domain.Entities;

public class Task
{
    public int TaskId { get; set; }

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<TaskComment> TaskComments { get; set; } = new List<TaskComment>();
}
