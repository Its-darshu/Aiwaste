import React, { useState, useEffect } from 'react';
import client from '../api/client';

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('reports');
  const [notifications, setNotifications] = useState([]);
  const [newWorker, setNewWorker] = useState({ email: '', password: '', full_name: '', phone_number: '' });
  const [stats, setStats] = useState({ active_complaints: 0, online_workers: 0 });

  useEffect(() => {
    fetchData();
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      if (event.data !== "STATS_UPDATE") {
        setNotifications(prev => [event.data, ...prev]);
        setTimeout(() => {
          setNotifications(prev => prev.slice(0, -1));
        }, 5000);
      }
      // Refresh data on new activity
      fetchData();
    };
    
    return () => ws.close();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, workersRes, usersRes, allUsersRes, logsRes, statsRes] = await Promise.all([
        client.get('/admin/reports'),
        client.get('/admin/workers'),
        client.get('/admin/users'),
        client.get('/admin/all-users'),
        client.get('/admin/activity-logs'),
        client.get('/admin/stats')
      ]);
      setReports(reportsRes.data);
      setWorkers(workersRes.data);
      setUsers(usersRes.data);
      setAllUsers(allUsersRes.data);
      setActivityLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      await client.post('/admin/workers', newWorker);
      setNewWorker({ email: '', password: '', full_name: '', phone_number: '' });
      fetchData();
    } catch (error) {
      console.error("Failed to create worker", error);
      alert("Failed to create worker");
    }
  };

  const handleDeleteWorker = async (workerId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await client.delete(`/admin/workers/${workerId}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete worker", error);
    }
  };

  const handleRegenerateQR = async (workerId) => {
    try {
      await client.post(`/admin/workers/${workerId}/regenerate-qr`);
      fetchData();
    } catch (error) {
      console.error("Failed to regenerate QR", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          {notifications.map((msg, idx) => (
            <div key={idx} className="bg-blue-500 text-white px-4 py-2 rounded shadow mb-2">
              {msg}
            </div>
          ))}
        </div>
      )}
      
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Complaints</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.active_complaints}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Online Workers</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.online_workers}</dd>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['reports', 'workers', 'users', 'history', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab === 'history' ? 'All Accounts' : tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Reports Section */}
        {activeTab === 'reports' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                          <tr key={report.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <img className="h-10 w-10 rounded-full object-cover" src={`/${report.image_url}`} alt="" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{report.description}</div>
                              <div className="text-sm text-gray-500">{report.latitude}, {report.longitude}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                report.status === 'cleaned' ? 'bg-green-100 text-green-800' : 
                                report.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.worker_id ? workers.find(w => w.id === report.worker_id)?.full_name || 'Unknown' : 'Unassigned'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workers Section */}
        {activeTab === 'workers' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Manage Workers</h2>
            
            {/* Create Worker Form */}
            <form onSubmit={handleCreateWorker} className="mb-8 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Add New Worker</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="border p-2 rounded"
                  value={newWorker.full_name}
                  onChange={e => setNewWorker({...newWorker, full_name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="border p-2 rounded"
                  value={newWorker.email}
                  onChange={e => setNewWorker({...newWorker, email: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="border p-2 rounded"
                  value={newWorker.password}
                  onChange={e => setNewWorker({...newWorker, password: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border p-2 rounded"
                  value={newWorker.phone_number}
                  onChange={e => setNewWorker({...newWorker, phone_number: e.target.value})}
                />
              </div>
              <button type="submit" className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                Create Worker
              </button>
            </form>

            {/* Workers List */}
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Token</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workers.map((worker) => (
                          <tr key={worker.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{worker.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{worker.qr_login_token}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button onClick={() => handleRegenerateQR(worker.id)} className="text-indigo-600 hover:text-indigo-900 mr-4">Regenerate QR</button>
                              <button onClick={() => handleDeleteWorker(worker.id)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeTab === 'users' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Registered Users</h2>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone_number || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Accounts History Section */}
        {activeTab === 'history' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">All Accounts History</h2>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                user.role === 'worker' ? 'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log Section */}
        {activeTab === 'activity' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activityLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                log.action.includes('LOGIN') ? 'bg-green-100 text-green-800' : 
                                log.action.includes('LOGOUT') ? 'bg-gray-100 text-gray-800' : 
                                log.action.includes('DELETE') ? 'bg-red-100 text-red-800' : 
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.details}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user_id || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
