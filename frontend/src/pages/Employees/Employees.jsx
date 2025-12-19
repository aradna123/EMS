import { useEffect, useState } from 'react';
import { employeeService } from '../../services/employeeService';
import { Plus, Search, Download, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isManager } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, [page, search]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployees({
        page,
        limit: 10,
        search: search || undefined,
      });
      setEmployees(response.employees || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      await employeeService.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await employeeService.exportEmployees();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Employees exported successfully');
    } catch (error) {
      toast.error('Failed to export employees');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Employees</h1>
          <p className="text-gray-600 text-lg">Manage employee records</p>
        </div>
        <div className="flex space-x-3">
          {isManager && (
            <>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
              >
                <Download size={20} />
                <span>Export</span>
              </button>
              <Link
                to="/employees/new"
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus size={20} />
                <span className="font-semibold">Add Employee</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl shadow-lg p-5 border border-white/20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search employees by name, email, or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden border border-white/20">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    {isManager && (
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg ring-2 ring-white">
                            {emp.avatar ? (
                              <img src={`http://localhost:5000/uploads/${emp.avatar}`} alt={emp.name} className="w-12 h-12 rounded-full ring-2 ring-white" />
                            ) : (
                              <span className="text-white font-bold text-lg">{emp.name?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                            <div className="text-sm text-gray-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.employee_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.position || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                            emp.status === 'active'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                              : emp.status === 'on_leave'
                              ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                              : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {emp.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/employees/${emp.id}`}
                              className="p-2 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                              title="View"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              to={`/employees/${emp.id}/edit`}
                              className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all transform hover:scale-110"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all transform hover:scale-110"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Employees;

