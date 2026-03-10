import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from '../components/GlobalSearch';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
  { to: '/company', label: 'Company', icon: <Building2 size={18} /> },
  { to: '/profile', label: 'My Profile', icon: <User size={18} /> },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isManager, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'w-14' : 'w-56';

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {/* --- Sidebar --- */}
      <aside
        className={`flex flex-col ${sidebarWidth} bg-gray-900 text-gray-100 transition-all duration-200 flex-shrink-0`}
      >
        {/* Logo / Collapse button */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-700">
          {!collapsed && (
            <span className="text-sm font-bold text-white tracking-wide truncate">
              ProjectStorage
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-3 py-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isManager
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              {user?.roleName ?? 'User'}
            </span>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="border-t border-gray-700 px-2 py-3 space-y-1">
          {!collapsed && (
            <p className="text-xs text-gray-500 truncate px-2">{user?.companyEmail}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm text-gray-400 hover:bg-red-700/40 hover:text-red-300 transition-colors"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 shadow-sm">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.companyEmail?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
