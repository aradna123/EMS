import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Employees from './pages/Employees/Employees';
import EmployeeForm from './pages/Employees/EmployeeForm';
import EmployeeDetail from './pages/Employees/EmployeeDetail';
import Departments from './pages/Departments/Departments';
import Attendance from './pages/Attendance/Attendance';
import Leaves from './pages/Leaves/Leaves';
import LeaveForm from './pages/Leaves/LeaveForm';
import Profile from './pages/Profile/Profile';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/new"
            element={
              <ProtectedRoute requiredRole="manager">
                <MainLayout>
                  <EmployeeForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <ProtectedRoute requiredRole="manager">
                <MainLayout>
                  <EmployeeForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute requiredRole="manager">
                <MainLayout>
                  <EmployeeDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute requiredRole="manager">
                <MainLayout>
                  <Employees />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute requiredRole="manager">
                <MainLayout>
                  <Departments />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Attendance />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LeaveForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves/:id/edit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LeaveForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Leaves />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
