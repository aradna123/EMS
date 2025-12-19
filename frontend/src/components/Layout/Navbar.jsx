import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="glass shadow-lg border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          <NotificationDropdown />

          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-white">
              <span className="text-sm font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

