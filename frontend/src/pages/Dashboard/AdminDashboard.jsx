import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Users, Building2, Calendar, FileText, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
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
      change: `${data.activeEmployees || 0} active`,
    },
    {
      title: 'Departments',
      value: data.totalDepartments || 0,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      title: 'Present Today',
      value: data.presentToday || 0,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Leaves',
      value: data.pendingLeaves || 0,
      icon: FileText,
      color: 'bg-orange-500',
    },
  ];

  const departmentData = data.departmentStats?.map((dept) => ({
    name: dept.name || 'Unassigned',
    employees: dept.count || 0,
  })) || [];

  const leaveData = data.leaveStats || [];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 text-lg">Overview of your organization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const gradients = [
            'from-blue-500 to-blue-600',
            'from-green-500 to-emerald-600',
            'from-purple-500 to-purple-600',
            'from-orange-500 to-amber-600',
          ];
          return (
            <div 
              key={stat.title} 
              className="glass rounded-2xl shadow-lg p-6 card-hover border border-white/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.change && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`bg-gradient-to-br ${gradients[index]} p-4 rounded-xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform`}>
                  <Icon className="text-white" size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Chart */}
        <div className="glass rounded-2xl shadow-xl p-6 border border-white/20 card-hover">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Building2 className="mr-2 text-blue-600" size={24} />
            Employees by Department
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="employees" fill="url(#colorGradient)" radius={[8, 8, 0, 0]}>
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Status Chart */}
        <div className="glass rounded-2xl shadow-xl p-6 border border-white/20 card-hover">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="mr-2 text-purple-600" size={24} />
            Leave Requests Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leaveData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {leaveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
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

      {/* Pending Leave Requests */}
      {data.pendingLeaveRequests && data.pendingLeaveRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Leave Requests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.pendingLeaveRequests.slice(0, 5).map((leave) => (
                  <tr key={leave.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leave.employee_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{leave.leave_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

