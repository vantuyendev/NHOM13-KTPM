import { useEffect, useMemo, useState } from 'react';
import { Shield, Building2, CheckCircle, XCircle, KeyRound, Save, ListChecks } from 'lucide-react';
import { getMyProfile, getMyTasks, updateMyProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { PersonalTask, User } from '../types';

const TASK_STATUS_LABELS: Record<string, string> = {
  'To Do': 'Cần làm',
  'In Progress': 'Đang tiến hành',
  Done: 'Hoàn thành',
  Blocked: 'Đang vướng mắc',
};

export default function Profile() {
  const { token, login } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<PersonalTask[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'tasks'>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editForm, setEditForm] = useState({ systemUserId: '', companyEmail: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getMyProfile().then((r) => {
        setUser(r.data);
        setEditForm({ systemUserId: r.data.systemUserId, companyEmail: r.data.companyEmail });
      }),
      getMyTasks().then((r) => setMyTasks(r.data)),
    ])
      .catch(() => setError('Không thể tải hồ sơ cá nhân.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setSaving(true);
    setError('');
    try {
      const res = await updateMyProfile({
        systemUserId: editForm.systemUserId.trim(),
        companyEmail: editForm.companyEmail.trim(),
      });
      setUser(res.data);
      login(token, res.data);
    } catch {
      setError('Không thể cập nhật hồ sơ cá nhân.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <div className="text-red-500 p-4">{error || 'Không thể tải hồ sơ cá nhân.'}</div>;

  const statusClass = useMemo(
    () => user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400',
    [user.isActive]
  );

  const fields = [
    {
      icon: <Shield size={16} />,
      label: 'Vai trò',
      value: (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.roleId === 1 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
          {user.roleId === 1 ? 'Quản lý' : 'Thành viên'}
        </span>
      ),
    },
    {
      icon: <Building2 size={16} />,
      label: 'Phòng ban',
      value: user.departmentId ? `Phòng ban #${user.departmentId}` : '— Chưa được phân công —',
    },
    {
      icon: user.isActive ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />,
      label: 'Trạng thái tài khoản',
      value: (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
          {user.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
        </span>
      ),
    },
    {
      icon: <KeyRound size={16} />,
      label: 'Bắt buộc đổi mật khẩu',
      value: (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.mustChangePassword ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {user.mustChangePassword ? 'Có' : 'Không'}
        </span>
      ),
    },
  ];

  const initials = user.companyEmail.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Hồ sơ cá nhân</h1>

      {/* Avatar card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{user.companyEmail}</p>
          <p className="text-sm text-gray-500">{user.systemUserId}</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
        >
          Thông tin hồ sơ
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px inline-flex items-center gap-1.5 ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
        >
          <ListChecks size={15} /> Tác vụ cá nhân ({myTasks.length})
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Chỉnh sửa thông tin cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Mã người dùng hệ thống</label>
                <input
                  value={editForm.systemUserId}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, systemUserId: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email công ty</label>
                <input
                  type="email"
                  value={editForm.companyEmail}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, companyEmail: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>

          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {fields.map((field, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="text-gray-400 flex-shrink-0">{field.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">{field.label}</p>
                  <div className="text-sm text-gray-800">{typeof field.value === 'string' ? field.value : field.value}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {myTasks.length === 0 ? (
            <p className="text-sm text-gray-400 p-8 text-center">Không có tác vụ cá nhân.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {myTasks.map((task) => (
                <div key={task.taskId} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{task.projectName} (#{task.projectId})</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{TASK_STATUS_LABELS[task.status] ?? task.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'} {'->'} {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
