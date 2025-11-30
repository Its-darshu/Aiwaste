import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

const WorkerLogin = () => {
  const { qrLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('scan'); // 'scan' or 'manual'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let scanner = null;

    if (mode === 'scan') {
      // Small delay to ensure DOM element exists
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(error => {
            console.error("Failed to clear html5-qrcode scanner. ", error);
          });
        }
      };
    }
  }, [mode]);

  const onScanSuccess = (decodedText, decodedResult) => {
    setCode(decodedText);
    handleLoginWithCode(decodedText);
  };

  const onScanFailure = (error) => {
    // console.warn(`Code scan error = ${error}`);
  };

  const handleLoginWithCode = async (token) => {
    setError('');
    setLoading(true);
    try {
      await qrLogin(token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    handleLoginWithCode(code);
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
            <div id="reader" className="w-full overflow-hidden rounded-lg mb-4"></div>
            <p className="text-sm text-gray-600 mb-4">Point your camera at the QR code</p>
            
            {/* Fallback/Manual entry in scan mode if needed */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                </div>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Token Manually"
              className="w-full px-3 py-2 border rounded-lg mt-4 mb-4"
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
