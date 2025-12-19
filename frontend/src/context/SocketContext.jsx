import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.getNotifications({ status: 'all', limit: 50 });
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = API_URL.replace('/api', '');

    // Create socket connection
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Authenticate socket connection
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('authenticate', {
        userId: user.id,
        role: user.role,
      });
    });

    // Listen for new leave requests (managers/admins)
    newSocket.on('newLeaveRequest', (data) => {
      console.log('New leave request notification:', data);
      // Refresh notifications
      fetchNotifications();
    });

    // Listen for notification read events
    newSocket.on('notificationRead', (data) => {
      console.log('Notification read event:', data);
      // Refresh notifications
      fetchNotifications();
    });

    // Listen for leave status updates (employees)
    newSocket.on('leaveStatusUpdate', (data) => {
      console.log('Leave status update:', data);
      // Refresh notifications
      fetchNotifications();
    });

    // Handle disconnection
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Handle connection errors
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Fetch initial notifications
    fetchNotifications();

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user?.id, user?.role]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, status: 'read', read_at: new Date().toISOString() } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // Update local state
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      // Update unread count if it was unread
      const notif = notifications.find((n) => n.id === notificationId);
      if (notif && notif.status === 'unread') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    fetchNotifications();
  };

  const value = {
    socket,
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

