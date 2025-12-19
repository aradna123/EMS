import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { ArrowLeft, Save, Upload, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showNewDeptForm, setShowNewDeptForm] = useState(false);
  const [newDeptData, setNewDeptData] = useState({
    name: '',
    description: '',
  });
  const [creatingDept, setCreatingDept] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employee_code: '',
    department_id: '',
    position: '',
    salary: '',
    join_date: '',
    phone: '',
    address: '',
    status: 'active',
    password: '',
  });

  useEffect(() => {
    fetchDepartments();
    if (isEdit) {
      fetchEmployee();
    }
  }, [id]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      setDepartments(response);
    } catch (error) {
      console.error('Failed to load departments');
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const employee = await employeeService.getEmployee(id);
      
      // Format date for input field (YYYY-MM-DD)
      let formattedDate = '';
      if (employee.join_date) {
        const date = new Date(employee.join_date);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        employee_code: employee.employee_code || '',
        department_id: employee.department_id ? String(employee.department_id) : '',
        position: employee.position || '',
        salary: employee.salary ? String(employee.salary) : '',
        join_date: formattedDate,
        phone: employee.phone || '',
        address: employee.address || '',
        status: employee.status || 'active',
        password: '', // Don't pre-fill password
      });
    } catch (error) {
      console.error('Error loading employee:', error);
      toast.error('Failed to load employee');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewDeptChange = (e) => {
    const { name, value } = e.target;
    setNewDeptData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newDeptData.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    setCreatingDept(true);
    try {
      const newDept = await departmentService.createDepartment({
        name: newDeptData.name.trim(),
        description: newDeptData.description.trim() || null,
      });
      
      toast.success('Department created successfully');
      
      // Refresh departments list
      await fetchDepartments();
      
      // Select the newly created department
      setFormData(prev => ({
        ...prev,
        department_id: String(newDept.id)
      }));
      
      // Reset and close form
      setNewDeptData({ name: '', description: '' });
      setShowNewDeptForm(false);
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error(error.response?.data?.message || 'Failed to create department');
    } finally {
      setCreatingDept(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {};
      
      if (isEdit) {
        // For edit, always send name and email (required fields)
        submitData.name = formData.name.trim();
        submitData.email = formData.email.trim();
        
        // Send other fields
        submitData.position = formData.position?.trim() || null;
        submitData.status = formData.status || 'active';
        
        // Handle department_id - convert to number or null
        submitData.department_id = formData.department_id ? parseInt(formData.department_id) : null;
        
        // Handle salary - convert to number or null
        submitData.salary = formData.salary && formData.salary !== '' ? parseFloat(formData.salary) : null;
        
        // Handle phone - send null if empty
        submitData.phone = formData.phone?.trim() || null;
        
        // Handle address - send null if empty
        submitData.address = formData.address?.trim() || null;
      } else {
        // For create, include all required fields
        submitData.name = formData.name.trim();
        submitData.email = formData.email.trim();
        submitData.employee_code = formData.employee_code.trim();
        submitData.join_date = formData.join_date;
        submitData.position = formData.position?.trim() || null;
        submitData.status = formData.status || 'active';
        submitData.department_id = formData.department_id ? parseInt(formData.department_id) : null;
        submitData.salary = formData.salary ? parseFloat(formData.salary) : null;
        submitData.phone = formData.phone?.trim() || null;
        submitData.address = formData.address?.trim() || null;
        
        // Password is optional for create (defaults to 'password123' on backend)
        if (formData.password && formData.password.trim() !== '') {
          submitData.password = formData.password;
        }
      }

      console.log('Submitting data:', submitData);

      if (isEdit) {
        const response = await employeeService.updateEmployee(id, submitData);
        console.log('Update response:', response);
        toast.success('Employee updated successfully');
      } else {
        await employeeService.createEmployee(submitData);
        toast.success('Employee created successfully');
      }
      
      navigate('/employees');
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Employee' : 'Add New Employee'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update employee information' : 'Create a new employee record'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="employee_code"
              value={formData.employee_code}
              onChange={handleChange}
              required
              disabled={isEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <div className="space-y-2">
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              
              {departments.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="mb-2">No departments found. Please create a department first.</p>
                </div>
              )}
              
              {!showNewDeptForm ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowNewDeptForm(true);
                  }}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={16} />
                  <span>Add New Department</span>
                </button>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Create New Department</h4>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowNewDeptForm(false);
                        setNewDeptData({ name: '', description: '' });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Department Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newDeptData.name}
                      onChange={handleNewDeptChange}
                      placeholder="e.g., Engineering, Sales, HR"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={newDeptData.description}
                      onChange={handleNewDeptChange}
                      placeholder="Brief description of the department"
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCreateDepartment}
                      disabled={creatingDept || !newDeptData.name.trim()}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      <Plus size={14} />
                      <span>{creatingDept ? 'Creating...' : 'Create & Select'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowNewDeptForm(false);
                        setNewDeptData({ name: '', description: '' });
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary
            </label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="join_date"
              value={formData.join_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank for default password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Default: password123 (if left blank)</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Save size={20} />
            <span>{loading ? 'Saving...' : 'Save Employee'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;

