import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [role, setRole] = useState('user');

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(role);
      navigate('/');
    } catch (err) {
      setError('Failed to login with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to WasteMgmt
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select your role and sign in with Google
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              I am a...
            </label>
            <select
              id="role"
              name="role"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User (Report Waste)</option>
              <option value="worker">Worker (Clean Waste)</option>
              <option value="admin">Admin (Manage System)</option>
            </select>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div>
            <button
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
