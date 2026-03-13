using Nhom13.ProjectStorage.Api.Domain.Entities;

namespace Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

public interface IUserRepository : IRepository<User>
{
    System.Threading.Tasks.Task<User?> GetByEmailAsync(string email);
    System.Threading.Tasks.Task<User?> GetByEmailWithRoleAsync(string email);
}
