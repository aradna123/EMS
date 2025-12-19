import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'manager') {
    return <ManagerDashboard />;
  }

  return <EmployeeDashboard />;
};

export default Dashboard;

