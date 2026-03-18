import { useEffect, useState } from 'react';
import { Building2, Users, Plus, X, Pencil, Trash2 } from 'lucide-react';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getUsers, createUser, deleteUser, updateUser,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Department, User } from '../types';

export default function Company() {
  const { isManager, user } = useAuth();
  const isMember = user?.roleName === 'Member' || (user as { role?: string } | null)?.role === 'Member';
  const canManageCompany = isManager && !isMember;
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({ companyEmail: '', roleId: '2', departmentId: '', isActive: true });
  const [savingEditUser, setSavingEditUser] = useState(false);

  useEffect(() => {
    Promise.all([
      getDepartments().then((r) => setDepartments(r.data)),
      getUsers().then((r) => setUsers(r.data)),
    ])
      .catch(() => setError('Không thể tải dữ liệu công ty.'))
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
      setError('Không thể lưu phòng ban.');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa phòng ban này? Chỉ xóa được khi chưa có nhân viên được gán.')) return;
    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.departmentId !== id));
      if (filterDeptId === id) setFilterDeptId(null);
    } catch {
      setError('Không thể xóa phòng ban do vẫn còn nhân viên.');
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
      setError('Không thể thêm nhân viên.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bạn có chắc muốn vô hiệu hóa nhân viên này?')) return;
    try {
      await deleteUser(userId);
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      setError('Không thể xóa nhân viên.');
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      companyEmail: user.companyEmail,
      roleId: String(user.roleId),
      departmentId: user.departmentId ? String(user.departmentId) : '',
      isActive: user.isActive,
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEditUser(true);
    try {
      await updateUser(editingUser.userId, {
        companyEmail: editUserForm.companyEmail.trim(),
        roleId: Number(editUserForm.roleId),
        departmentId: Number(editUserForm.departmentId),
        isActive: editUserForm.isActive,
      });
      const res = await getUsers();
      setUsers(res.data);
      setEditingUser(null);
    } catch {
      setError('Không thể cập nhật nhân viên.');
    } finally {
      setSavingEditUser(false);
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
      <h1 className="text-xl font-bold text-gray-900 mb-6">Công ty</h1>

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
            <h2 className="font-semibold text-gray-800">Phòng ban</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{departments.length}</span>
          </div>
          {canManageCompany && (
            <button onClick={openCreateDept} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition">
              <Plus size={15} /> Thêm phòng ban
            </button>
          )}
        </div>

        {departments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Chưa có phòng ban.</p>
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
                      <p className="text-xs text-gray-400 mt-1">{count} nhân viên</p>
                    </div>
                    {canManageCompany && (
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
            <h2 className="font-semibold text-gray-800">Nhân viên</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filteredUsers.length}</span>
            {filterDeptId && (
              <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                {departments.find((d) => d.departmentId === filterDeptId)?.name}
                <button onClick={() => setFilterDeptId(null)} className="ml-1 hover:text-indigo-900"><X size={11} /></button>
              </span>
            )}
          </div>
          {canManageCompany && (
            <button onClick={() => setShowUserForm(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition">
              <Plus size={15} /> Thêm nhân viên
            </button>
          )}
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Chưa có nhân viên{filterDeptId ? ' trong phòng ban này' : ''}.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Vai trò</th>
                  <th className="px-4 py-3 text-left font-medium">Phòng ban</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  {canManageCompany && <th className="px-4 py-3" />}
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
                          {user.roleId === 1 ? 'Quản lý' : 'Thành viên'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{deptName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {user.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                        </span>
                      </td>
                      {canManageCompany && (
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => openEditUser(user)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteUser(user.userId)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
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
              <h3 className="font-semibold text-gray-900">{editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban'}</h3>
              <button onClick={() => setShowDeptForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên phòng ban</label>
                <input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required placeholder="Nhập tên phòng ban" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} rows={3} placeholder="Mô tả (không bắt buộc)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowDeptForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">Hủy</button>
                <button type="submit" disabled={savingDept} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition">
                  {savingDept ? 'Đang lưu…' : editingDept ? 'Cập nhật' : 'Tạo mới'}
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
              <h3 className="font-semibold text-gray-900">Thêm nhân viên</h3>
              <button onClick={() => setShowUserForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã người dùng hệ thống</label>
                <input value={userForm.systemUserId} onChange={(e) => setUserForm({ ...userForm, systemUserId: e.target.value })} required placeholder="e.g. EMP001" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email công ty</label>
                <input type="email" value={userForm.companyEmail} onChange={(e) => setUserForm({ ...userForm, companyEmail: e.target.value })} required placeholder="nhanvien@congty.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu tạm thời</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required placeholder="Nhập mật khẩu tạm thời" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                <select value={userForm.departmentId} onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                  <option value="">— Không có —</option>
                  {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">Hủy</button>
                <button type="submit" disabled={savingUser} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition">
                  {savingUser ? 'Đang tạo…' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Chỉnh sửa nhân viên</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email công ty</label>
                <input
                  type="email"
                  value={editUserForm.companyEmail}
                  onChange={(e) => setEditUserForm({ ...editUserForm, companyEmail: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                  <select
                    value={editUserForm.roleId}
                    onChange={(e) => setEditUserForm({ ...editUserForm, roleId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="1">Quản lý</option>
                    <option value="2">Thành viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                  <select
                    value={editUserForm.departmentId}
                    onChange={(e) => setEditUserForm({ ...editUserForm, departmentId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editUserForm.isActive}
                  onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.checked })}
                />
                Tài khoản đang hoạt động
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">Hủy</button>
                <button type="submit" disabled={savingEditUser} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition">
                  {savingEditUser ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
