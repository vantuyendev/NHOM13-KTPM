using Microsoft.EntityFrameworkCore;
using Nhom13.ProjectStorage.Api.Domain.Entities;
using Nhom13.ProjectStorage.Api.Infrastructure.Data;

namespace Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

public class ProjectRepository : Repository<Project>, IProjectRepository
{
    public ProjectRepository(AppDbContext context) : base(context) { }

    public async System.Threading.Tasks.Task<IEnumerable<Project>> GetProjectsForMemberAsync(int userId) =>
        await _context.Projects
            .Where(p => p.ProjectMembers.Any(pm => pm.UserId == userId))
            .Include(p => p.Manager)
            .ToListAsync();

    public async System.Threading.Tasks.Task<Project?> GetProjectWithMembersAsync(int projectId) =>
        await _context.Projects
            .Include(p => p.ProjectMembers)
            .Include(p => p.Manager)
            .FirstOrDefaultAsync(p => p.ProjectId == projectId);
}
