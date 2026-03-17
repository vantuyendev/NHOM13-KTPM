import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
  const [companyEmail, setCompanyEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await forgotPassword(companyEmail.trim());
      setMessage(res.data?.message ?? 'Nếu email tồn tại, hệ thống đã gửi liên kết đặt lại mật khẩu.');
    } catch {
      setError('Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Quên mật khẩu</h1>
        <p className="text-gray-400 text-sm mb-6">Nhập email công ty để nhận liên kết đặt lại mật khẩu.</p>

        {message && <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-lg">{message}</div>}
        {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Email công ty</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                required
                placeholder="ban@congty.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>

        <Link to="/login" className="mt-5 inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200">
          <ArrowLeft size={14} /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
