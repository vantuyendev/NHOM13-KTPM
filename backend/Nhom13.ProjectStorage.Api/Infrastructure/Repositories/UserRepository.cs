using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;

namespace Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async System.Threading.Tasks.Task<User?> GetByEmailAsync(string email) =>
        await _context.Users.FirstOrDefaultAsync(u => u.CompanyEmail == email && u.DeletedAt == null);

    public async System.Threading.Tasks.Task<User?> GetByEmailWithRoleAsync(string email) =>
        await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.CompanyEmail == email && u.DeletedAt == null);
}
