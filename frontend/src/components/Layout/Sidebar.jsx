import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileText,
  LogOut,
  User,
  Settings,
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, isAdmin, isManager } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'manager', 'employee'],
    },
    {
      title: 'Employees',
      icon: Users,
      path: '/employees',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Departments',
      icon: Building2,
      path: '/departments',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Attendance',
      icon: Calendar,
      path: '/attendance',
      roles: ['admin', 'manager', 'employee'],
    },
    {
      title: 'Leave Requests',
      icon: FileText,
      path: '/leaves',
      roles: ['admin', 'manager', 'employee'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.roles.includes('admin') && isAdmin) return true;
    if (item.roles.includes('manager') && isManager) return true;
    if (item.roles.includes('employee')) return true;
    return false;
  });

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl">
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          EMS
        </h1>
        <p className="text-sm text-gray-300 mt-1 font-medium">Employee Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
              }`}
            >
              <Icon size={20} className={isActive(item.path) ? 'animate-pulse' : ''} />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700/50 space-y-1.5">
        <Link
          to="/profile"
          className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive('/profile')
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <User size={20} />
          <span className="font-medium">Profile</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-white/20">
            <span className="text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

