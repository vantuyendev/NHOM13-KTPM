namespace Nhom13.ProjectStorage.Api.Application.DTOs;

public record CommentDto(int CommentId, int TaskId, int UserId, string UserEmail, string Content, DateTime CreatedAt);

public record AddCommentRequest(string Content);
