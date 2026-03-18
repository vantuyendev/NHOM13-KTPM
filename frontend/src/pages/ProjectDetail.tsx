import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import {
  ArrowLeft,
  CheckSquare,
  FileUp,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  addComment,
  addProjectMember,
  createTask,
  deleteDocument,
  deleteTask,
  getComments,
  getDocuments,
  getProject,
  getTasks,
  removeProjectMember,
  updateProject,
  updateTask,
  uploadDocument,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Comment, Document, Project, Task } from '../types';
import DocumentUploadModal from '../components/DocumentUploadModal';
import TaskEditModal from '../components/TaskEditModal';

type TabKey = 'tasks' | 'members' | 'documents';

const STATUS_BADGE: Record<string, string> = {
  'To Do': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Done: 'bg-green-100 text-green-700',
  Blocked: 'bg-red-100 text-red-600',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  'To Do': 'Cần làm',
  'In Progress': 'Đang tiến hành',
  Done: 'Hoàn thành',
  Blocked: 'Đang vướng mắc',
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  Active: 'Đang hoạt động',
  'On Hold': 'Tạm dừng',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
};

function toCommentModel(payload: any): Comment {
  return {
    commentId: payload.commentId ?? payload.CommentId ?? Date.now(),
    taskId: payload.taskId ?? payload.TaskId,
    userId: payload.userId ?? payload.UserId,
    userEmail: payload.userEmail ?? payload.UserEmail ?? 'Unknown',
    content: payload.content ?? payload.Content ?? '',
    createdAt: payload.createdAt ?? payload.CreatedAt ?? new Date().toISOString(),
  };
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { isManager, user, token } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tab, setTab] = useState<TabKey>('tasks');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', status: 'To Do', startDate: '', dueDate: '' });
  const [savingTask, setSavingTask] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', departmentId: '', managerUserId: '', status: 'Active' });
  const [savingProject, setSavingProject] = useState(false);

  const [newMemberId, setNewMemberId] = useState('');

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const selectedTaskRef = useRef<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    Promise.all([
      getProject(projectId).then((r) => setProject(r.data)),
      getTasks(projectId).then((r) => setTasks(r.data)),
      getDocuments(projectId).then((r) => setDocuments(r.data)),
    ])
      .catch(() => setError('Không thể tải dữ liệu dự án.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!project) return;
    setProjectForm({
      name: project.name,
      departmentId: String(project.departmentId),
      managerUserId: String(project.managerUserId),
      status: project.status,
    });
  }, [project]);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  useEffect(() => {
    if (!token || !projectId) return;

    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
    const normalizedApiBase = apiBase ? apiBase.replace(/\/+$/, '') : '';
    const hubBase = normalizedApiBase.endsWith('/api')
      ? normalizedApiBase.slice(0, -4)
      : normalizedApiBase;
    const hubUrl = import.meta.env.VITE_HUB_URL ?? `${hubBase || ''}/hubs/tasks`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('CommentAdded', (payload) => {
      const next = toCommentModel(payload);
      if (selectedTaskRef.current && next.taskId === selectedTaskRef.current.taskId) {
        setComments((prev) => {
          if (prev.some((c) => c.commentId === next.commentId)) return prev;
          return [...prev, next];
        });
      }
    });

    connection
      .start()
      .then(() => connection.invoke('JoinProjectGroup', projectId))
      .catch(() => {
        setError('Không thể kết nối bình luận thời gian thực.');
      });

    connectionRef.current = connection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.invoke('LeaveProjectGroup', projectId).catch(() => undefined);
        connectionRef.current.stop().catch(() => undefined);
      }
      connectionRef.current = null;
    };
  }, [projectId, token]);

  const openComments = async (task: Task) => {
    setSelectedTask(task);
    const res = await getComments(projectId, task.taskId);
    setComments(res.data);
  };

  const handleAddComment = async () => {
    if (!selectedTask || !commentText.trim()) return;
    setAddingComment(true);
    try {
      await addComment(projectId, selectedTask.taskId, commentText.trim());
      setCommentText('');
    } finally {
      setAddingComment(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTask(true);
    try {
      await createTask(projectId, {
        title: taskForm.title,
        status: taskForm.status,
        startDate: taskForm.startDate || null,
        dueDate: taskForm.dueDate || null,
      });
      const res = await getTasks(projectId);
      setTasks(res.data);
      setShowTaskForm(false);
      setTaskForm({ title: '', status: 'To Do', startDate: '', dueDate: '' });
    } catch {
      setError('Không thể tạo tác vụ.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await updateTask(projectId, task.taskId, { ...task, status: newStatus });
      setTasks((prev) => prev.map((t) => (t.taskId === task.taskId ? { ...t, status: newStatus } : t)));
    } catch {
      setError('Không thể cập nhật trạng thái tác vụ.');
    }
  };

  const handleTaskSave = async (
    taskId: number,
    payload: { title: string; status: string; dueDate: string | null; assigneeIds: number[] }
  ) => {
    const existing = tasks.find((t) => t.taskId === taskId);
    if (!existing) return;
    await updateTask(projectId, taskId, {
      ...existing,
      title: payload.title,
      status: payload.status,
      dueDate: payload.dueDate,
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === taskId
          ? { ...t, title: payload.title, status: payload.status, dueDate: payload.dueDate }
          : t
      )
    );
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Bạn có chắc muốn xóa tác vụ này?')) return;
    try {
      await deleteTask(projectId, taskId);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    } catch {
      setError('Không thể xóa tác vụ.');
    }
  };

  const handleUploadDocument = async (payload: {
    fileSizeBytes: number;
    cloudUrl?: string;
    taskId?: number;
    fileName?: string;
  }) => {
    await uploadDocument({
      projectId,
      fileSizeBytes: payload.fileSizeBytes,
      cloudUrl: payload.cloudUrl,
      taskId: payload.taskId,
    });
    const res = await getDocuments(projectId);
    setDocuments(res.data);
  };

  const handleAddMember = async () => {
    const userId = Number(newMemberId.trim());
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('ID thành viên không hợp lệ.');
      return;
    }

    try {
      await addProjectMember(projectId, userId);
      setNewMemberId('');
      const res = await getProject(projectId);
      setProject(res.data);
    } catch {
      setError('Không thể thêm thành viên.');
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSavingProject(true);
    try {
      await updateProject(project.projectId, {
        name: projectForm.name,
        departmentId: Number(projectForm.departmentId),
        managerUserId: Number(projectForm.managerUserId),
        status: projectForm.status,
      });
      const res = await getProject(project.projectId);
      setProject(res.data);
      setShowProjectEditModal(false);
    } catch {
      setError('Không thể cập nhật dự án.');
    } finally {
      setSavingProject(false);
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    if (!project || memberUserId === project.managerUserId) return;
    if (!confirm('Bạn có chắc muốn xóa thành viên này khỏi dự án?')) return;
    try {
      await removeProjectMember(project.projectId, memberUserId);
      const res = await getProject(project.projectId);
      setProject(res.data);
    } catch {
      setError('Không thể xóa thành viên.');
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    try {
      await deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== documentId));
    } catch {
      setError('Không thể xóa tài liệu.');
    }
  };

  const isProjectMember = useMemo(() => {
    if (!project || !user) return false;
    if (isManager) return true;
    if (!project.projectMembers) return true;
    return project.projectMembers.some((m) => m.userId === user.userId);
  }, [isManager, project, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return <div className="text-red-500 p-4">{error || 'Không tìm thấy dự án.'}</div>;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'tasks', label: 'Tác vụ', icon: <CheckSquare size={15} /> },
    { key: 'documents', label: 'Tài liệu', icon: <FileUp size={15} /> },
    { key: 'members', label: 'Thành viên', icon: <Users size={15} /> },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {project.projectCode}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {PROJECT_STATUS_LABELS[project.status] ?? project.status}
            </span>
            {isManager && (
              <button
                onClick={() => setShowProjectEditModal(true)}
                className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 inline-flex items-center gap-1"
              >
                <Pencil size={12} /> Chỉnh sửa dự án
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Phòng ban #{project.departmentId}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="border-b border-gray-200 flex gap-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Tác vụ ({tasks.length})</h2>
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={15} /> Tạo mới tác vụ
            </button>
          </div>

          {tasks.length === 0 ? (
            <p className="text-gray-400 text-sm py-10 text-center">Chưa có tác vụ. Hãy tạo mới để bắt đầu.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.taskId}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-indigo-300 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'} {'->'}{' '}
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div className="relative">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium appearance-none pr-5 cursor-pointer ${
                        STATUS_BADGE[task.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {['To Do', 'In Progress', 'Done', 'Blocked'].map((s) => (
                        <option key={s} value={s}>{TASK_STATUS_LABELS[s] ?? s}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => openComments(task)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                    title="Bình luận"
                  >
                    <MessageSquare size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.taskId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                    title="Xóa"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showTaskForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Tạo mới tác vụ</h3>
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                    <input
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      required
                      placeholder="Nhập tiêu đề tác vụ"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    >
                      {['To Do', 'In Progress', 'Done', 'Blocked'].map((s) => (
                        <option key={s} value={s}>{TASK_STATUS_LABELS[s] ?? s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={taskForm.startDate}
                        onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={savingTask}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition"
                    >
                      {savingTask ? 'Đang tạo...' : 'Tạo mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedTask && (
            <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{selectedTask.title}</h3>
                <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Chưa có bình luận.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.commentId} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {c.userEmail[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <span className="text-xs font-medium text-gray-700 truncate">{c.userEmail}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 pl-8">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Nhập bình luận..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={addingComment || !commentText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Tài liệu ({documents.length})</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={15} /> Tải lên tài liệu
            </button>
          </div>

          {documents.length === 0 ? (
            <p className="text-gray-400 text-sm py-10 text-center">Chưa có tài liệu.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.documentId}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      doc.storageType === 'Internal'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {doc.storageType === 'Internal' ? 'INT' : 'CLD'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{doc.internalPath ?? doc.cloudUrl ?? '—'}</p>
                    <p className="text-xs text-gray-400">{(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  {doc.cloudUrl && (
                    <a
                      href={doc.cloudUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex-shrink-0"
                    >
                      Mở
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(doc.documentId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                    title="Xóa tài liệu"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Thành viên dự án</h2>
          {isManager && (
            <div className="flex gap-2 mb-5">
              <input
                type="number"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                placeholder="Nhập ID người dùng"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 w-44"
              />
              <button
                onClick={handleAddMember}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                Thêm thành viên
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-3">Quản lý: Người dùng #{project.managerUserId}</p>
          {!!project.projectMembers?.length && (
            <div className="space-y-2">
              {project.projectMembers.map((m) => (
                <div key={m.userId} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-3">
                  <span>{m.companyEmail} (#{m.userId})</span>
                  {isManager && m.userId !== project.managerUserId && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                      title="Xóa thành viên"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showProjectEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Chỉnh sửa dự án</h3>
              <button onClick={() => setShowProjectEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                <input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID phòng ban</label>
                  <input
                    type="number"
                    value={projectForm.departmentId}
                    onChange={(e) => setProjectForm({ ...projectForm, departmentId: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID quản lý</label>
                  <input
                    type="number"
                    value={projectForm.managerUserId}
                    onChange={(e) => setProjectForm({ ...projectForm, managerUserId: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
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
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowProjectEditModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  {savingProject ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUploadDocument}
      />

      <TaskEditModal
        isOpen={!!editingTask}
        task={editingTask}
        canEdit={isProjectMember}
        onClose={() => setEditingTask(null)}
        onSave={handleTaskSave}
      />
    </div>
  );
}
