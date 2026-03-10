using Nhom13.ProjectStorage.Api.Infrastructure.Data;

namespace Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IUserRepository? _users;
    private IProjectRepository? _projects;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => _users ??= new UserRepository(_context);
    public IProjectRepository Projects => _projects ??= new ProjectRepository(_context);

    public async System.Threading.Tasks.Task<int> SaveChangesAsync() =>
        await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
}
