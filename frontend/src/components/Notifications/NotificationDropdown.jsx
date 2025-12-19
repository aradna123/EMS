import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSocket();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (notification.status === 'unread') {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        toast.error('Failed to mark notification as read');
      }
    }

    // Navigate based on notification type
    if (notification.type === 'leave_request' || notification.type === 'leave_status') {
      const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
      if (data?.leaveRequestId) {
        navigate(`/leaves`);
        setIsOpen(false);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_request':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'leave_status':
        return <Calendar className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type, status) => {
    if (status === 'unread') {
      return 'bg-blue-50 border-blue-200';
    }
    if (type === 'leave_status') {
      return 'bg-green-50 border-green-200';
    }
    return 'bg-white border-gray-200';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all group"
      >
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Mark all as read"
                  >
                    <CheckCheck size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
                  const isUnread = notification.status === 'unread';
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 border-l-4 ${
                        isUnread ? 'border-blue-500' : 'border-transparent'
                      } ${getNotificationColor(notification.type, notification.status)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              {data?.days && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {data.days} day{data.days !== 1 ? 's' : ''} • {data.startDate} to {data.endDate}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {notification.type === 'leave_status' && data?.status && (
                                <div className="flex-shrink-0">
                                  {data.status === 'approved' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                </div>
                              )}
                              {isUnread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                              <button
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                title="Delete notification"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => {
                  navigate('/leaves');
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all leaves
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

