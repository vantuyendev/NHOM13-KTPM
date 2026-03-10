namespace Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IProjectRepository Projects { get; }
    System.Threading.Tasks.Task<int> SaveChangesAsync();
}
