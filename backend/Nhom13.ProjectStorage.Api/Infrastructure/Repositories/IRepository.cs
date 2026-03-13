using System.Linq.Expressions;

namespace Nhom13.ProjectStorage.Api.Infrastructure.Repositories;

public interface IRepository<T> where T : class
{
    System.Threading.Tasks.Task<T?> GetByIdAsync(int id);
    System.Threading.Tasks.Task<IEnumerable<T>> GetAllAsync();
    System.Threading.Tasks.Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    System.Threading.Tasks.Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    System.Threading.Tasks.Task AddAsync(T entity);
    void Update(T entity);
    void Remove(T entity);
}
