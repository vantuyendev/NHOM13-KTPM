using Nhom13.ProjectStorage.Api.Domain.Entities;

namespace Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

public interface IProjectRepository : IRepository<Project>
{
    System.Threading.Tasks.Task<IEnumerable<Project>> GetProjectsForMemberAsync(int userId);
    System.Threading.Tasks.Task<Project?> GetProjectWithMembersAsync(int projectId);
}
