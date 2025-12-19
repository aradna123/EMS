import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Calendar, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EmployeeDashboard = () => {
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

  const leaveBalance = data.leave_balance || {
    sick_leave: 10,
    vacation_leave: 20,
    personal_leave: 5,
    emergency_leave: 3,
  };

  const attendanceStats = data.attendance_stats || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Leave Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data.pending_leave_requests || 0}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <FileText className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.present || 0}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Late Arrivals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceStats.late || 0}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Balance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Sick Leave</p>
            <p className="text-2xl font-bold text-blue-600">{leaveBalance.sick_leave || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Vacation</p>
            <p className="text-2xl font-bold text-green-600">{leaveBalance.vacation_leave || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Personal</p>
            <p className="text-2xl font-bold text-purple-600">{leaveBalance.personal_leave || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Emergency</p>
            <p className="text-2xl font-bold text-red-600">{leaveBalance.emergency_leave || 0}</p>
          </div>
        </div>
        <Link
          to="/leaves"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All Leaves →
        </Link>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Attendance</h2>
          <Link to="/attendance" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {data.recent_attendance?.slice(0, 7).map((attendance, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(attendance.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {attendance.check_in && `Check-in: ${attendance.check_in}`}
                    {attendance.check_out && ` | Check-out: ${attendance.check_out}`}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  attendance.status === 'present'
                    ? 'bg-green-100 text-green-800'
                    : attendance.status === 'late'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {attendance.status || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/attendance"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <Clock className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="font-medium text-gray-900">Check In/Out</p>
            <p className="text-sm text-gray-500">Record your attendance</p>
          </Link>
          <Link
            to="/leaves?action=new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <FileText className="mx-auto mb-2 text-gray-400" size={24} />
            <p className="font-medium text-gray-900">Request Leave</p>
            <p className="text-sm text-gray-500">Submit a new leave request</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

