import { useEffect, useState } from 'react';
import { leaveService } from '../../services/leaveService';
import { Plus, Calendar, CheckCircle, XCircle, Edit, Trash2, Users, User } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

// Leave Requests Table Component
const LeaveRequestsTable = ({ 
  leaves, 
  isManager, 
  isAdmin, 
  isEmployee, 
  user, 
  handleApprove, 
  handleReject, 
  handleDelete, 
  getStatusColor 
}) => {
  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden border border-white/20">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Days</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              {(isManager || isEmployee) && (
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {leaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg ring-2 ring-white">
                      <span className="text-white font-bold text-sm">
                        {leave.employee_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{leave.employee_name}</div>
                      <div className="text-xs text-gray-500">{leave.employee_code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700 font-medium capitalize">{leave.leave_type?.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-gray-900">{leave.days}</span>
                  <span className="text-xs text-gray-500 ml-1">days</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${getStatusColor(leave.status)}`}>
                    {leave.status?.toUpperCase()}
                  </span>
                </td>
                {/* Actions column */}
                {(isManager || isEmployee) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* Approval actions - Only show for managers/admins on pending requests */}
                      {isManager && leave.status === 'pending' && (
                        <>
                          {/* Check if requester is a manager - only admins can approve */}
                          {leave.requester_role === 'manager' ? (
                            isAdmin ? (
                              <>
                                <button
                                  onClick={() => handleApprove(leave.id)}
                                  className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all transform hover:scale-110 shadow-sm"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleReject(leave.id)}
                                  className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all transform hover:scale-110 shadow-sm"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 font-medium">Admin approval required</span>
                            )
                          ) : (
                            // Regular employee requests - managers can approve
                            <>
                              <button
                                onClick={() => handleApprove(leave.id)}
                                className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all transform hover:scale-110 shadow-sm"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all transform hover:scale-110 shadow-sm"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                      
                      {/* Edit/Delete actions - Show for employees and managers on their own pending requests */}
                      {leave.status === 'pending' && leave.employee_email === user?.email && (
                        <>
                          <Link
                            to={`/leaves/${leave.id}/edit`}
                            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all transform hover:scale-110 shadow-sm"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(leave.id)}
                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all transform hover:scale-110 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const { isManager, isEmployee, isAdmin, user } = useAuth();

  useEffect(() => {
    fetchLeaves();
    fetchBalance();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await leaveService.getLeaveRequests(params);
      setLeaves(response.leaves || response.leave_requests || []);
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await leaveService.getLeaveBalance();
      setBalance(response);
    } catch (error) {
      console.error('Failed to load leave balance');
    }
  };

  const handleApprove = async (id) => {
    try {
      await leaveService.approveLeaveRequest(id, 'approved');
      toast.success('Leave request approved');
      fetchLeaves();
      fetchBalance();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve leave request';
      toast.error(errorMessage);
    }
  };

  const handleReject = async (id) => {
    try {
      await leaveService.rejectLeaveRequest(id);
      toast.success('Leave request rejected');
      fetchLeaves();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject leave request';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;

    try {
      await leaveService.deleteLeaveRequest(id);
      toast.success('Leave request deleted');
      fetchLeaves();
      fetchBalance();
    } catch (error) {
      toast.error('Failed to delete leave request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200';
      case 'rejected':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200';
      case 'pending':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Separate leaves for managers: own requests vs department employees' requests
  const managerOwnLeaves = isManager && !isAdmin ? leaves.filter(leave => leave.employee_email === user?.email) : [];
  const departmentEmployeeLeaves = isManager && !isAdmin ? leaves.filter(leave => leave.employee_email !== user?.email) : [];
  const displayLeaves = isManager && !isAdmin ? [] : leaves; // For admins and employees, show all

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Leave Requests</h1>
          <p className="text-gray-600 text-lg">Manage leave requests</p>
        </div>
        {(isEmployee || isManager) && (
          <Link
            to="/leaves/new"
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus size={20} />
            <span className="font-semibold">Request Leave</span>
          </Link>
        )}
      </div>

      {/* Leave Balance */}
      {(isEmployee || isManager) && balance && (
        <div className="glass rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="mr-2 text-blue-600" size={24} />
            Leave Balance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-2">Sick Leave</p>
              <p className="text-3xl font-bold text-blue-600">{balance.sick_leave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days remaining</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-xl border-2 border-green-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-2">Vacation</p>
              <p className="text-3xl font-bold text-green-600">{balance.vacation_leave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days remaining</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border-2 border-purple-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-2">Personal</p>
              <p className="text-3xl font-bold text-purple-600">{balance.personal_leave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days remaining</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-100 p-5 rounded-xl border-2 border-red-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-2">Emergency</p>
              <p className="text-3xl font-bold text-red-600">{balance.emergency_leave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days remaining</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-2xl shadow-lg p-4 border border-white/20">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/leaves"
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              !statusFilter 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            All
          </Link>
          <Link
            to="/leaves?status=pending"
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              statusFilter === 'pending' 
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            Pending
          </Link>
          <Link
            to="/leaves?status=approved"
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              statusFilter === 'approved' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            Approved
          </Link>
          <Link
            to="/leaves?status=rejected"
            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
              statusFilter === 'rejected' 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            Rejected
          </Link>
        </div>
      </div>

      {/* Leave Requests - Separated for Managers */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leave requests...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Manager's Own Leave Requests */}
          {isManager && !isAdmin && managerOwnLeaves.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">My Leave Requests</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {managerOwnLeaves.length}
                </span>
              </div>
              <LeaveRequestsTable 
                leaves={managerOwnLeaves} 
                isManager={isManager}
                isAdmin={isAdmin}
                isEmployee={isEmployee}
                user={user}
                handleApprove={handleApprove}
                handleReject={handleReject}
                handleDelete={handleDelete}
                getStatusColor={getStatusColor}
              />
            </div>
          )}

          {/* Department Employees' Leave Requests */}
          {isManager && !isAdmin && departmentEmployeeLeaves.length > 0 && (
            <div className="space-y-4 mt-8">
              <div className="flex items-center space-x-3">
                <div className="h-1 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">Department Employees' Leave Requests</h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  {departmentEmployeeLeaves.length}
                </span>
              </div>
              <LeaveRequestsTable 
                leaves={departmentEmployeeLeaves} 
                isManager={isManager}
                isAdmin={isAdmin}
                isEmployee={isEmployee}
                user={user}
                handleApprove={handleApprove}
                handleReject={handleReject}
                handleDelete={handleDelete}
                getStatusColor={getStatusColor}
              />
            </div>
          )}

          {/* All Leave Requests (for Admins and Employees) */}
          {(!isManager || isAdmin || isEmployee) && displayLeaves.length > 0 && (
            <LeaveRequestsTable 
              leaves={displayLeaves} 
              isManager={isManager}
              isAdmin={isAdmin}
              isEmployee={isEmployee}
              user={user}
              handleApprove={handleApprove}
              handleReject={handleReject}
              handleDelete={handleDelete}
              getStatusColor={getStatusColor}
            />
          )}

          {/* Empty State */}
          {leaves.length === 0 && !loading && (
            <div className="glass rounded-2xl shadow-xl p-12 text-center border border-white/20">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-600">
                {isManager && !isAdmin 
                  ? "You don't have any leave requests yet, and there are no pending requests from your department employees."
                  : "No leave requests found."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaves;

