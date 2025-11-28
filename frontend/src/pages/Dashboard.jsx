import React from 'react';
import { useAuth } from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import WorkerDashboard from './WorkerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'worker':
      return <WorkerDashboard />;
    case 'user':
    default:
      return <UserDashboard />;
  }
};

export default Dashboard;
