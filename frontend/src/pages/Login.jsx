import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import Figma Assets
import imgGroup3 from '../assets/figma_login_v3/228bb8e0bdd7ea42ed6715e941c02a9bfa19294d.svg';
import imgVector22 from '../assets/figma_login_v3/b899c208f676befe91abc2a6be1a1fb85c43a207.svg';
import imgVector21 from '../assets/figma_login_v3/d32752c5defb7c3b1188b16dd2c0d0c4d0c1877e.svg';
import imgVector5 from '../assets/figma_login_v3/d4ed38ad759bd1e276594229b14a80b35951b7a0.svg';

const Login = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Default to Login
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

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#4e9b4d] to-[#8bc34a] flex items-center justify-center">
      
      {/* --- Figma Background Assets (Desktop Layout) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {/* Main Background Group - The large organic shape */}
         <div className="absolute h-[798px] w-[782px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 mix-blend-overlay">
            <img src={imgGroup3} alt="" className="w-full h-full object-contain" />
         </div>

         {/* Decorative Vectors - Positioned relatively to viewport or card */}
         <div className="absolute right-[10%] bottom-[10%] w-[167px] h-[130px] rotate-[330deg] hidden md:block opacity-40">
            <img src={imgVector22} alt="" className="w-full h-full invert brightness-0" />
         </div>
         
         <div className="absolute left-[30%] bottom-[-5%] w-[73px] h-[51px] hidden md:block opacity-40">
            <img src={imgVector21} alt="" className="w-full h-full invert brightness-0" />
         </div>

         <div className="absolute right-[5%] top-[40%] w-[110px] h-[189px] rotate-180 scale-y-[-1] hidden md:block opacity-40">
            <img src={imgVector5} alt="" className="w-full h-full invert brightness-0" />
         </div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 bg-white/20 backdrop-blur-md p-8 rounded-[37px] shadow-2xl w-full max-w-[484px] mx-4 border border-white/30">
        
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
                className="w-full h-[50px] px-4 border border-gray-600 rounded-[7px] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] placeholder-gray-700 text-lg font-sans"
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
              className="w-full h-[50px] px-4 border border-gray-600 rounded-[7px] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] placeholder-gray-700 text-lg font-sans"
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
                className="w-full h-[50px] px-4 border border-gray-600 rounded-[7px] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] placeholder-gray-700 text-lg font-sans"
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
              className="w-full h-[50px] px-4 border border-gray-600 rounded-[7px] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#2e7d32] placeholder-gray-700 text-lg font-sans"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#4e9b4d] text-white text-2xl font-medium rounded-[7px] hover:bg-[#3d7a3c] transition-colors duration-200 flex items-center justify-center shadow-lg disabled:opacity-50 font-sans"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Submit')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-xs text-gray-800 hover:text-white font-medium transition-colors font-sans"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
