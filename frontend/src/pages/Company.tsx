import { useEffect, useState } from 'react';
import { Building2, Users, Plus, X, Pencil, Trash2 } from 'lucide-react';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getUsers, createUser, deleteUser,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Department, User } from '../types';

export default function Company() {
  const { isManager } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDeptId, setFilterDeptId] = useState<number | null>(null);

  // Department form
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [savingDept, setSavingDept] = useState(false);

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ systemUserId: '', companyEmail: '', password: '', departmentId: '' });
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    Promise.all([
      getDepartments().then((r) => setDepartments(r.data)),
      getUsers().then((r) => setUsers(r.data)),
    ])
      .catch(() => setError('Failed to load company data.'))
      .finally(() => setLoading(false));
  }, []);

  const openCreateDept = () => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '' });
    setShowDeptForm(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name, description: dept.description ?? '' });
    setShowDeptForm(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDept(true);
    try {
      if (editingDept) {
        await updateDepartment(editingDept.departmentId, deptForm);
      } else {
        await createDepartment(deptForm);
      }
      const res = await getDepartments();
      setDepartments(res.data);
      setShowDeptForm(false);
    } catch {
      setError('Failed to save department.');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm('Delete this department? Only possible if no employees are assigned.')) return;
    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.departmentId !== id));
      if (filterDeptId === id) setFilterDeptId(null);
    } catch {
      setError('Cannot delete department — it may still have employees.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      await createUser({
        systemUserId: userForm.systemUserId,
        companyEmail: userForm.companyEmail,
        password: userForm.password,
        roleId: 2,
        departmentId: userForm.departmentId ? Number(userForm.departmentId) : undefined,
      });
      const res = await getUsers();
      setUsers(res.data);
      setShowUserForm(false);
      setUserForm({ systemUserId: '', companyEmail: '', password: '', departmentId: '' });
    } catch {
      setError('Failed to create employee.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Deactivate this employee?')) return;
    try {
      await deleteUser(userId);
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      setError('Failed to delete employee.');
    }
  };

  const filteredUsers = filterDeptId
    ? users.filter((u) => u.departmentId === filterDeptId)
    : users;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Company</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={15} /></button>
        </div>
      )}

      {/* ── Departments ── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Departments</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{departments.length}</span>
          </div>
          {isManager && (
            <button onClick={openCreateDept} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition">
              <Plus size={15} /> Add Department
            </button>
          )}
        </div>

        {departments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No departments yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const count = users.filter((u) => u.departmentId === dept.departmentId).length;
              return (
                <div
                  key={dept.departmentId}
                  onClick={() => setFilterDeptId(filterDeptId === dept.departmentId ? null : dept.departmentId)}
                  className={`cursor-pointer border rounded-xl px-4 py-4 transition ${
                    filterDeptId === dept.departmentId
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{dept.name}</p>
                      {dept.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dept.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{count} employee{count !== 1 ? 's' : ''}</p>
                    </div>
                    {isManager && (
                      <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEditDept(dept)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"><Pencil size={13} /></button>
                        <button onClick={() => handleDeleteDept(dept.departmentId)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Employees ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Employees</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filteredUsers.length}</span>
            {filterDeptId && (
              <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                {departments.find((d) => d.departmentId === filterDeptId)?.name}
                <button onClick={() => setFilterDeptId(null)} className="ml-1 hover:text-indigo-900"><X size={11} /></button>
              </span>
            )}
          </div>
          {isManager && (
            <button onClick={() => setShowUserForm(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition">
              <Plus size={15} /> Add Employee
            </button>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No employees{filterDeptId ? ' in this department' : ''} yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Department</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  {isManager && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const deptName = departments.find((d) => d.departmentId === user.departmentId)?.name;
                  return (
                    <tr key={user.userId} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">{user.systemUserId}</td>
                      <td className="px-4 py-3 text-gray-800">{user.companyEmail}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.roleId === 1 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.roleId === 1 ? 'Manager' : 'Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{deptName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isManager && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteUser(user.userId)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Department Modal */}
      {showDeptForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setShowDeptForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required placeholder="Department name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} rows={3} placeholder="Optional description" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowDeptForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={savingDept} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition">
                  {savingDept ? 'Saving…' : editingDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Add Employee</h3>
              <button onClick={() => setShowUserForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System User ID</label>
                <input value={userForm.systemUserId} onChange={(e) => setUserForm({ ...userForm, systemUserId: e.target.value })} required placeholder="e.g. EMP001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                <input type="email" value={userForm.companyEmail} onChange={(e) => setUserForm({ ...userForm, companyEmail: e.target.value })} required placeholder="user@company.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required placeholder="Temporary password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={userForm.departmentId} onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                  <option value="">— None —</option>
                  {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={savingUser} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition">
                  {savingUser ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
