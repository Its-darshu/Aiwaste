import React, { useState, useEffect } from 'react';
import client from '../api/client';

const WorkerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await client.get('/tasks/');
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!file || !selectedTask) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await client.post(`/tasks/${selectedTask.id}/complete`, formData);
      setMessage("Task completed successfully!");
      setSelectedTask(null);
      setFile(null);
      fetchTasks();
    } catch (error) {
      console.error("Failed to complete task", error);
      setMessage(error.response?.data?.detail || "Failed to complete task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">Worker Dashboard</h1>
        
        {message && <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">{message}</div>}

        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Tasks</h3>
          <ul className="divide-y divide-gray-200 mt-4">
            {tasks.map((task) => (
              <li key={task.id} className="py-4 bg-white shadow rounded-lg mb-4 p-4">
                <div className="flex space-x-4">
                  <img className="h-24 w-24 rounded object-cover" src={`http://localhost:8000/${task.image_url}`} alt="Waste" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-medium">{task.description}</h3>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'cleaned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Location: {task.latitude}, {task.longitude}</p>
                    
                    {task.status === 'assigned' && (
                      <div className="mt-4">
                        {selectedTask?.id === task.id ? (
                          <form onSubmit={handleComplete} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Upload Cleanup Photo</label>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                              >
                                {loading ? 'Verifying...' : 'Submit Proof'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedTask(null)}
                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Complete Task
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {tasks.length === 0 && <p className="text-gray-500">No tasks assigned.</p>}
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
