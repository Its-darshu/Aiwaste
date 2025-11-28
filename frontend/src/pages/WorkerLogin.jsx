import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const WorkerLogin = () => {
  const { qrLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('scan'); // 'scan' or 'manual'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await qrLogin(code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Worker Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={() => setMode('scan')}
            className={`px-4 py-2 rounded-lg ${mode === 'scan' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Scan QR
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-lg ${mode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Manual Code
          </button>
        </div>

        {mode === 'scan' ? (
          <div className="text-center">
            <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center mb-4">
              <span className="text-gray-500">Camera View (Simulation)</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Point your camera at the QR code</p>
            {/* Simulation input for scan result */}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Simulate Scan Result (Enter Token)"
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <button
              onClick={handleLogin}
              disabled={loading || !code}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Worker Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your worker code"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WorkerLogin;
