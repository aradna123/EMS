import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaveService } from '../../services/leaveService';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LeaveForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [balance, setBalance] = useState(null);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [leaveStatus, setLeaveStatus] = useState(null);

  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchBalance();
    if (isEdit) {
      fetchLeaveRequest();
    }
  }, [id]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      calculateDays();
    } else {
      setCalculatedDays(0);
    }
  }, [formData.start_date, formData.end_date]);

  const fetchBalance = async () => {
    try {
      const response = await leaveService.getLeaveBalance();
      setBalance(response);
    } catch (error) {
      console.error('Failed to load leave balance');
    }
  };

  const fetchLeaveRequest = async () => {
    try {
      setLoadingData(true);
      const leave = await leaveService.getLeaveRequest(id);
      
      // Check if leave can be edited (only pending leaves can be edited)
      if (leave.status !== 'pending') {
        toast.error('Only pending leave requests can be edited');
        navigate('/leaves');
        return;
      }

      setLeaveStatus(leave.status);
      
      // Format dates for input fields
      const startDate = leave.start_date ? format(new Date(leave.start_date), 'yyyy-MM-dd') : '';
      const endDate = leave.end_date ? format(new Date(leave.end_date), 'yyyy-MM-dd') : '';
      
      setFormData({
        leave_type: leave.leave_type || '',
        start_date: startDate,
        end_date: endDate,
        reason: leave.reason || '',
      });
    } catch (error) {
      console.error('Error loading leave request:', error);
      toast.error('Failed to load leave request');
      navigate('/leaves');
    } finally {
      setLoadingData(false);
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) {
      setCalculatedDays(0);
      return;
    }

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    if (start > end) {
      setCalculatedDays(0);
      return;
    }

    // Calculate working days (excluding weekends)
    let days = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setCalculatedDays(days);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAvailableBalance = () => {
    if (!balance || !formData.leave_type) return null;
    
    const balanceField = `${formData.leave_type}_leave`;
    return balance[balanceField] || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (calculatedDays <= 0) {
        toast.error('Invalid date range. Please select valid start and end dates.');
        return;
      }

      const availableBalance = getAvailableBalance();
      if (availableBalance !== null && calculatedDays > availableBalance) {
        toast.error(`Insufficient leave balance. Available: ${availableBalance} days, Requested: ${calculatedDays} days`);
        return;
      }

      const submitData = {
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim() || null,
      };

      if (isEdit) {
        await leaveService.updateLeaveRequest(id, submitData);
        toast.success('Leave request updated successfully');
      } else {
        await leaveService.submitLeaveRequest(submitData);
        toast.success('Leave request submitted successfully');
      }
      navigate('/leaves');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'vacation', label: 'Vacation Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
  ];

  const availableBalance = getAvailableBalance();
  const minDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/leaves')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            {isEdit ? 'Edit Leave Request' : 'Request Leave'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isEdit ? 'Update your leave request' : 'Submit a new leave request'}
          </p>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leave request...</p>
          </div>
        </div>
      ) : (
        <>
          {isEdit && leaveStatus === 'pending' && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ You can only edit pending leave requests. Once approved or rejected, changes cannot be made.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="glass rounded-2xl shadow-xl p-6 md:p-8 space-y-6 border border-white/20">
        {/* Leave Balance Display */}
        {balance && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Available Leave Balance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sick Leave</p>
                <p className="text-lg font-bold text-gray-900">{balance.sick_leave || 0} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vacation Leave</p>
                <p className="text-lg font-bold text-gray-900">{balance.vacation_leave || 0} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Personal Leave</p>
                <p className="text-lg font-bold text-gray-900">{balance.personal_leave || 0} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Leave</p>
                <p className="text-lg font-bold text-gray-900">{balance.emergency_leave || 0} days</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              name="leave_type"
              value={formData.leave_type}
              onChange={handleChange}
              required
              disabled={isEdit && leaveStatus !== 'pending'}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {formData.leave_type && availableBalance !== null && (
              <p className="text-sm text-gray-600 mt-1">
                Available: <span className="font-semibold">{availableBalance} days</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              min={minDate}
              required
              disabled={isEdit && leaveStatus !== 'pending'}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              min={formData.start_date || minDate}
              required
              disabled={isEdit && leaveStatus !== 'pending'}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Requested
            </label>
            <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-gray-400" />
                <span className="text-lg font-semibold text-gray-900">
                  {calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Working days (excluding weekends)</p>
              {formData.leave_type && availableBalance !== null && calculatedDays > 0 && (
                <p className={`text-xs mt-1 ${calculatedDays > availableBalance ? 'text-red-600' : 'text-green-600'}`}>
                  {calculatedDays > availableBalance
                    ? `⚠️ Insufficient balance (need ${calculatedDays - availableBalance} more days)`
                    : `✓ Sufficient balance available`}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason (Optional)
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={4}
            placeholder="Please provide a reason for your leave request..."
            disabled={isEdit && leaveStatus !== 'pending'}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/leaves')}
            className="px-6 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || calculatedDays <= 0 || (isEdit && leaveStatus !== 'pending')}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Save size={20} />
            <span>{loading ? (isEdit ? 'Updating...' : 'Submitting...') : (isEdit ? 'Update Request' : 'Submit Request')}</span>
          </button>
        </div>
      </form>
      </>
      )}
    </div>
  );
};

export default LeaveForm;

