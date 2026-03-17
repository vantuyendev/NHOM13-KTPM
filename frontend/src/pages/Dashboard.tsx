import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Download, Trash2, X } from 'lucide-react';
import { getProjects, createProject, deleteProject, downloadProject } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  Active: 'Đang hoạt động',
  Completed: 'Hoàn thành',
  'On Hold': 'Tạm dừng',
  Cancelled: 'Đã hủy',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { isManager, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ projectCode: '', name: '', departmentId: '', managerUserId: '', status: 'Active' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      setError('Không thể tải danh sách dự án.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject({
        projectCode: form.projectCode,
        name: form.name,
        departmentId: Number(form.departmentId),
        managerUserId: Number(form.managerUserId) || user?.userId,
        status: form.status,
      });
      await loadProjects();
      setShowCreate(false);
      setForm({ projectCode: '', name: '', departmentId: '', managerUserId: '', status: 'Active' });
    } catch {
      setError('Không thể tạo dự án.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa dự án này?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.projectId !== id));
    } catch {
      setError('Không thể xóa dự án.');
    }
  };

  const handleDownload = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await downloadProject(proj.projectId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${proj.projectCode}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Không thể tải dự án.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dự án</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isManager ? 'Tất cả dự án của công ty' : 'Các dự án bạn đang tham gia'}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} /> Tạo mới dự án
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FolderKanban size={40} className="mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy dự án.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.projectId}
              onClick={() => navigate(`/projects/${proj.projectId}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-mono">{proj.projectCode}</p>
                  <h3 className="font-semibold text-gray-800 truncate mt-0.5">{proj.name}</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${
                    STATUS_COLORS[proj.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {PROJECT_STATUS_LABELS[proj.status] ?? proj.status}
                </span>
              </div>
              <p className="text-xs text-gray-400">Phòng ban #{proj.departmentId}</p>

              {/* Actions */}
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => handleDownload(proj, e)}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 px-2.5 py-1 rounded-md transition"
                >
                  <Download size={13} />
                  Tải xuống
                </button>
                {isManager && (
                  <button
                    onClick={(e) => handleDelete(proj.projectId, e)}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 px-2.5 py-1 rounded-md transition"
                  >
                    <Trash2 size={13} />
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Tạo mới dự án</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã dự án</label>
                <input
                  value={form.projectCode}
                  onChange={(e) => setForm({ ...form, projectCode: e.target.value })}
                  required
                  placeholder="PRJ-001"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Nhập tên dự án"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID phòng ban</label>
                  <input
                    type="number"
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    {[
                      { value: 'Active', label: 'Đang hoạt động' },
                      { value: 'On Hold', label: 'Tạm dừng' },
                      { value: 'Completed', label: 'Hoàn thành' },
                      { value: 'Cancelled', label: 'Đã hủy' },
                    ].map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  {creating ? 'Đang tạo…' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
