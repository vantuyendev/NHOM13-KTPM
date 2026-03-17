namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record TaskDto(int TaskId, int ProjectId, string Title, string Status, DateTime? StartDate, DateTime? DueDate);

public record PersonalTaskDto(
	int TaskId,
	int ProjectId,
	string ProjectName,
	string Title,
	string Status,
	DateTime? StartDate,
	DateTime? DueDate
);

public record CreateTaskRequest(string Title, string Status, DateTime? StartDate, DateTime? DueDate);

public record UpdateTaskRequest(string Title, string Status, DateTime? StartDate, DateTime? DueDate);
