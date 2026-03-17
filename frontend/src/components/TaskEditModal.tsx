import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Task } from '../types';

interface Props {
  isOpen: boolean;
  task: Task | null;
  canEdit: boolean;
  onClose: () => void;
  onSave: (taskId: number, payload: { title: string; status: string; dueDate: string | null; assigneeIds: number[] }) => Promise<void>;
}

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done', 'Blocked'];

const STATUS_LABELS: Record<string, string> = {
  'To Do': 'Cần làm',
  'In Progress': 'Đang tiến hành',
  Done: 'Hoàn thành',
  Blocked: 'Đang vướng mắc',
};

export default function TaskEditModal({ isOpen, task, canEdit, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('To Do');
  const [dueDate, setDueDate] = useState('');
  const [assigneesText, setAssigneesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? '');
    setStatus(task.status ?? 'To Do');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setAssigneesText('');
    setError('');
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError('');
    try {
      const assigneeIds = assigneesText
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0);

      await onSave(task.taskId, {
        title: title.trim(),
        status,
        dueDate: dueDate || null,
        assigneeIds,
      });
      onClose();
    } catch {
      setError('Không thể lưu tác vụ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Chỉnh sửa tác vụ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {!canEdit && (
          <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg">
            Bạn không có quyền chỉnh sửa tác vụ này. Chỉ thành viên dự án mới được phép cập nhật.
          </div>
        )}

        {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canEdit}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEdit}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
            <input
              value={assigneesText}
              onChange={(e) => setAssigneesText(e.target.value)}
              disabled={!canEdit}
              placeholder="Nhập ID người dùng, phân tách bằng dấu phẩy (ví dụ: 3,5,8)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">Backend hiện chưa lưu danh sách người phụ trách ở giai đoạn này; giao diện đã sẵn sàng để tích hợp.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">Hủy</button>
            <button type="submit" disabled={!canEdit || saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
