import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Default role is 'user'
        await signup(email, password, fullName, 'user', phoneNumber);
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#f0fdf4] flex items-center justify-center">
      {/* Decorative Background Elements mimicking the Figma design */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-300/30 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Main Card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-sm p-8 rounded-[37px] shadow-xl w-full max-w-[484px] mx-4">
        
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 font-sans">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="relative">
              <input
                type="text"
                placeholder="Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[50px] px-4 border border-black rounded-[7px] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#4e9b4d] placeholder-gray-500 text-lg"
                required
              />
            </div>
          )}

          <div className="relative">
            <input
              type={isLogin ? "text" : "email"}
              placeholder={isLogin ? "Email or Phone Number" : "Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[50px] px-4 border border-black rounded-[7px] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#4e9b4d] placeholder-gray-500 text-lg"
              required
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full h-[50px] px-4 border border-black rounded-[7px] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#4e9b4d] placeholder-gray-500 text-lg"
                required
              />
            </div>
          )}

          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[50px] px-4 border border-black rounded-[7px] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#4e9b4d] placeholder-gray-500 text-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#4e9b4d] text-white text-xl font-medium rounded-[7px] hover:bg-[#3d7a3c] transition-colors duration-200 flex items-center justify-center shadow-md disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Submit')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-gray-600 hover:text-[#4e9b4d] font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
