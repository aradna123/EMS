import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Users, Calendar, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardService.getDashboard();
      setData(response);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!data) return null;

  const statCards = [
    {
      title: 'Total Employees',
      value: data.totalEmployees || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Present Today',
      value: data.presentToday || 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Leaves',
      value: data.pendingLeaves || 0,
      icon: FileText,
      color: 'bg-orange-500',
      link: '/leaves?status=pending',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your team</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );

          return stat.link ? (
            <Link key={stat.title} to={stat.link}>
              {content}
            </Link>
          ) : (
            <div key={stat.title}>{content}</div>
          );
        })}
      </div>

      {/* Attendance Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-2xl font-bold text-blue-600">{data.attendance?.present || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Late</p>
            <p className="text-2xl font-bold text-yellow-600">{data.attendance?.late || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-2xl font-bold text-red-600">{data.attendance?.absent || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-600">{data.attendance?.totalEmployees || 0}</p>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests */}
      {data.pendingLeaveRequests && data.pendingLeaveRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pending Leave Requests</h2>
            <Link to="/leaves?status=pending" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {data.pendingLeaveRequests.slice(0, 5).map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{leave.employee_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{leave.leave_type} leave</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{leave.days} days</p>
                  <Link
                    to={`/leaves/${leave.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {data.recentActivities?.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Clock size={16} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

