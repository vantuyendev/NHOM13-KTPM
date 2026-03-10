import { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Shield, Building2, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import { getMyProfile } from '../services/api';
import type { User } from '../types';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((r) => setUser(r.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <div className="text-red-500 p-4">{error || 'Unable to load profile.'}</div>;

  const fields = [
    { icon: <UserIcon size={16} />, label: 'System User ID', value: user.systemUserId },
    { icon: <Mail size={16} />, label: 'Company Email', value: user.companyEmail },
    {
      icon: <Shield size={16} />,
      label: 'Role',
      value: (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.roleId === 1 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
          {user.roleId === 1 ? 'Manager' : 'Member'}
        </span>
      ),
    },
    {
      icon: <Building2 size={16} />,
      label: 'Department',
      value: user.departmentId ? `Department #${user.departmentId}` : '— Not assigned —',
    },
    {
      icon: user.isActive ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />,
      label: 'Account Status',
      value: (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      icon: <KeyRound size={16} />,
      label: 'Must Change Password',
      value: (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.mustChangePassword ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {user.mustChangePassword ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  const initials = user.companyEmail.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-6">My Profile</h1>

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

      {/* Detail fields */}
      <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
        {fields.map((field, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="text-gray-400 flex-shrink-0">{field.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{field.label}</p>
              <div className="text-sm text-gray-800">
                {typeof field.value === 'string' ? field.value : field.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
