namespace Nhom13.ProjectStorage.Api.Domain.Entities;

public class TaskComment
{
    public int CommentId { get; set; }

    public int TaskId { get; set; }
    public Task Task { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
