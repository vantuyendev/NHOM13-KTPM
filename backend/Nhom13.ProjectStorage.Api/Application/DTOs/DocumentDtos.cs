namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record DocumentDto(int DocumentId, int ProjectId, int? TaskId, string StorageType, long FileSizeBytes, string? InternalPath, string? CloudUrl);

public record UploadDocumentRequest(int ProjectId, int? TaskId, long FileSizeBytes, string? CloudUrl);
