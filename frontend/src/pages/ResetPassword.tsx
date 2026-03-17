import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const tokenFromQuery = useMemo(() => new URLSearchParams(location.search).get('token') ?? '', [location.search]);

  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token.trim()) {
      setError('Vui lòng nhập mã token đặt lại mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      setMessage('Đặt lại mật khẩu thành công. Đang chuyển về màn hình đăng nhập...');
      setTimeout(() => navigate('/login'), 1200);
    } catch {
      setError('Đặt lại mật khẩu thất bại. Token có thể không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Đặt lại mật khẩu</h1>
        <p className="text-gray-400 text-sm mb-6">Nhập token và mật khẩu mới.</p>

        {message && <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-lg">{message}</div>}
        {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Token đặt lại</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="Dán token vào đây"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition"
          >
            {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <Link to="/login" className="mt-5 inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200">
          <ArrowLeft size={14} /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
