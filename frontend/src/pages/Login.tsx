import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, X } from 'lucide-react';
import axios from 'axios';
import { login as loginApi, changeFirstPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Change-password modal state
  const [showModal, setShowModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Store token temporarily when MustChangePassword = true
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const { token, mustChangePassword } = res.data;

      if (mustChangePassword) {
        localStorage.setItem('token', token);
        setShowModal(true);
      } else {
        // Fetch user profile
        localStorage.setItem('token', token);
        const profileRes = await getMyProfile();
        login(token, profileRes.data);
        navigate('/dashboard');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError('Không thể kết nối máy chủ. Vui lòng kiểm tra cấu hình API và CORS.');
        } else if (err.response.status === 401) {
          setError('Email hoặc mật khẩu không đúng.');
        } else {
          setError('Đăng nhập thất bại. Vui lòng thử lại.');
        }
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (newPw !== confirmPw) {
      setModalError('Mật khẩu mới không khớp.');
      return;
    }
    if (newPw.length < 6) {
      setModalError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setModalLoading(true);
    try {
      await changeFirstPassword(currentPw, newPw);
      // Now re-login with new password to get fresh token
      const res = await loginApi(email, newPw);
      localStorage.setItem('token', res.data.token);
      const profileRes = await getMyProfile();
      login(res.data.token, profileRes.data);
      setShowModal(false);
      navigate('/dashboard');
    } catch {
      setModalError('Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <Lock className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-white">ProjectStorage</h1>
          <p className="text-gray-400 text-sm mt-1">Đăng nhập tài khoản công ty</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email công ty</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ban@congty.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-indigo-300 hover:text-indigo-200">
                Quên mật khẩu?
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Đổi mật khẩu</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  localStorage.removeItem('token');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Đây là lần đăng nhập đầu tiên. Bạn cần đổi mật khẩu để tiếp tục.
            </p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {modalError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={modalLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition mt-2"
              >
                {modalLoading ? 'Đang đổi…' : 'Đổi mật khẩu và tiếp tục'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
