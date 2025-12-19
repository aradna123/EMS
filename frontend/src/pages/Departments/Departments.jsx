import { useEffect, useState } from 'react';
import { departmentService } from '../../services/departmentService';
import { Plus, Building2, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isManager } = useAuth();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartments();
      setDepartments(response);
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage organizational departments</p>
        </div>
        {isManager && (
          <Link
            to="/departments/new"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus size={20} />
            <span>Add Department</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              to={`/departments/${dept.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                    {dept.parent_name && (
                      <p className="text-sm text-gray-500">Parent: {dept.parent_name}</p>
                    )}
                  </div>
                </div>
              </div>

              {dept.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dept.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Users size={16} />
                    <span className="text-sm font-medium">{dept.employee_count || 0}</span>
                  </div>
                  {dept.avg_salary > 0 && (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <TrendingUp size={16} />
                      <span className="text-sm">${parseInt(dept.avg_salary).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Departments;

