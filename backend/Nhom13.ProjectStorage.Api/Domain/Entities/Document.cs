namespace Nhom13.ProjectStorage.Api.Domain.Entities;

public class Document
{
    public int DocumentId { get; set; }

    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int? TaskId { get; set; }
    public Task? Task { get; set; }

    public string StorageType { get; set; } = string.Empty; // 'Internal' or 'CloudLink'
    public long FileSizeBytes { get; set; }
    public string? InternalPath { get; set; }
    public string? CloudUrl { get; set; }
}
