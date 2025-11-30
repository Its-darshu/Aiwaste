import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import WorkerLogin from './pages/WorkerLogin';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const Navigation = () => {
  const { user, logout } = useAuth();

  if (!user) return null;
  
  // Hide global navigation for regular users as they have their own mobile-style nav
  if (user.role === 'user') return null;

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white font-bold text-xl">WasteMgmt</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/dashboard" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={logout}
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hostname = window.location.hostname;
    // Check if we are on a subdomain (e.g., worker.saaf.com)
    // This logic assumes the format: subdomain.domain.com
    const parts = hostname.split('.');
    
    // Subdomain Routing Logic
    if (hostname.startsWith('worker')) {
      // Workers should only see the worker login page, not the user login
      if (location.pathname === '/' || location.pathname === '/login') {
        navigate('/workers');
      }
    } else if (hostname.startsWith('admin')) {
      // Admins should only see the admin login page
      if (location.pathname === '/' || location.pathname === '/login') {
        navigate('/admin');
      }
    } else {
      // Main domain (ecosnap.me) - Users
      // if (location.pathname === '/') {
      //   navigate('/login');
      // }
    }
  }, [navigate, location]);

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/workers" element={<WorkerLogin />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
