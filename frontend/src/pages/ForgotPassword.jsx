import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Building2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success('If the email exists, a password reset link has been sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="max-w-md w-full relative z-10">
        <div className="glass rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg transform hover:scale-110 transition-transform">
              <Building2 className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600 text-lg">
              {submitted 
                ? 'Check your email for reset instructions' 
                : 'Enter your email to receive a password reset link'}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                    placeholder="you@example.com"
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
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-800 text-center">
                  <strong>Password reset link sent!</strong>
                  <br />
                  Please check your email inbox. If you don't see it, check your spam folder.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

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

export default ForgotPassword;

