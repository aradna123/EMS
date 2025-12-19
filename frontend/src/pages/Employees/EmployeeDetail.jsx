import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, DollarSign, Building2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployee(id);
      setEmployee(data);
    } catch (error) {
      toast.error('Failed to load employee');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Employee not found</p>
        <Link to="/employees" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employees')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Details</h1>
            <p className="text-gray-600 mt-1">View employee information</p>
          </div>
        </div>
        {isManager && (
          <Link
            to={`/employees/${id}/edit`}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Edit size={20} />
            <span>Edit Employee</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-2 ring-white">
              {employee.avatar ? (
                <img 
                  src={`http://localhost:5000/uploads/${employee.avatar}`} 
                  alt={employee.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                employee.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-gray-600 mt-1">{employee.position || 'Employee'}</p>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail size={16} />
                  <span>{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone size={16} />
                    <span>{employee.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Employee Code</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{employee.employee_code}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <p className="mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    employee.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : employee.status === 'on_leave'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {employee.status}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Department</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {employee.department_name || 'Not assigned'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Join Date</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {employee.join_date ? format(new Date(employee.join_date), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
            {employee.salary && (
              <div>
                <label className="text-sm text-gray-500">Salary</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  ${parseFloat(employee.salary).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">Role</label>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                {employee.role || 'Employee'}
              </p>
            </div>
          </div>

          {employee.address && (
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm text-gray-500 flex items-center space-x-2">
                <MapPin size={16} />
                <span>Address</span>
              </label>
              <p className="text-gray-900 mt-2">{employee.address}</p>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to={`/attendance?employee_id=${employee.id}`}
              className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center"
            >
              View Attendance
            </Link>
            <Link
              to={`/leaves?employee_id=${employee.id}`}
              className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center"
            >
              View Leaves
            </Link>
            {isManager && (
              <Link
                to={`/employees/${id}/edit`}
                className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-center transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Edit Employee
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;

