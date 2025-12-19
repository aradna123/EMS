import { useEffect, useState } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const { isEmployee } = useAuth();

  useEffect(() => {
    fetchAttendance();
    checkTodayStatus();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendance({ limit: 30 });
      setAttendance(response.attendance || []);
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayStatus = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await attendanceService.getAttendance({ start_date: today, end_date: today });
      const todayData = response.attendance?.[0];
      setTodayRecord(todayData);
      setCheckedIn(!!todayData?.check_in);
      setCheckedOut(!!todayData?.check_out);
    } catch (error) {
      console.error('Failed to check today status');
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn();
      toast.success('Checked in successfully!');
      checkTodayStatus();
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut();
      toast.success('Checked out successfully!');
      checkTodayStatus();
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check out');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">Track your attendance records</p>
      </div>

      {/* Check In/Out Card */}
      {isEmployee && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Attendance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Date: {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              {todayRecord && (
                <div className="mt-2 space-y-1">
                  {todayRecord.check_in && (
                    <p className="text-sm text-gray-700">Check-in: <span className="font-medium">{todayRecord.check_in}</span></p>
                  )}
                  {todayRecord.check_out && (
                    <p className="text-sm text-gray-700">Check-out: <span className="font-medium">{todayRecord.check_out}</span></p>
                  )}
                  {todayRecord.hours_worked && (
                    <p className="text-sm text-gray-700">Hours worked: <span className="font-medium">{todayRecord.hours_worked}</span></p>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              {!checkedIn ? (
                <button
                  onClick={handleCheckIn}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle size={20} />
                  <span>Check In</span>
                </button>
              ) : !checkedOut ? (
                <button
                  onClick={handleCheckOut}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle size={20} />
                  <span>Check Out</span>
                </button>
              ) : (
                <div className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg">
                  Completed for today
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Attendance History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.check_in || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.check_out || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.hours_worked || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'late'
                            ? 'bg-yellow-100 text-yellow-800'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;

