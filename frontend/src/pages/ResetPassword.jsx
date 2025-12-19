import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-md w-full relative z-10">
          <div className="glass rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 backdrop-blur-xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
                <CheckCircle2 className="text-white" size={40} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Password Reset Successful!</h1>
              <p className="text-gray-600 text-lg mb-6">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="max-w-md w-full relative z-10">
        <div className="glass rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg transform hover:scale-110 transition-transform">
              <Building2 className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600 text-lg">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                  placeholder="Enter new password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

