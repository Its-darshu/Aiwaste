import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';

const WorkerDashboard = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('my-tasks');
  
  // Camera & Location State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  useEffect(() => {
    fetchTasks();
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      fetchTasks();
    };
    
    return () => {
      ws.close();
      stopCamera();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const [myRes, availableRes] = await Promise.all([
        client.get('/tasks/my'),
        client.get('/tasks/available')
      ]);
      setMyTasks(Array.isArray(myRes.data) ? myRes.data : []);
      setAvailableTasks(Array.isArray(availableRes.data) ? availableRes.data : []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      setMessage("Failed to load tasks.");
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          resolve(position.coords);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setCapturedImage(null);
      // Get location when camera starts
      getLocation().catch(err => setMessage("Could not get location. Please enable GPS."));
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage("Error accessing camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        setCapturedImage(blob);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const handleClaim = async (taskId) => {
    setLoading(true);
    try {
      await client.post(`/tasks/${taskId}/claim`);
      setMessage("Task claimed successfully!");
      fetchTasks();
      setActiveTab('my-tasks');
    } catch (error) {
      console.error("Failed to claim task", error);
      setMessage(error.response?.data?.detail || "Failed to claim task.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!capturedImage || !selectedTask) return;
    if (!location) {
      setMessage("Location is required. Please enable GPS.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', capturedImage, 'cleanup.jpg');
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);

    try {
      await client.post(`/tasks/${selectedTask.id}/complete`, formData);
      setMessage("Task completed successfully!");
      setSelectedTask(null);
      setCapturedImage(null);
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Worker Dashboard</h1>
        
        {message && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-md shadow-sm flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700">&times;</button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`${
                activeTab === 'my-tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Tasks ({myTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('available-tasks')}
              className={`${
                activeTab === 'available-tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Available Tasks ({availableTasks.length})
            </button>
          </nav>
        </div>

        {/* My Tasks Section */}
        {activeTab === 'my-tasks' && (
          <div>
            {myTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">You have no assigned tasks.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myTasks.map((task) => (
                  <li key={task.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="relative h-48">
                      <img className="w-full h-full object-cover" src={`/${task.image_url}`} alt="Waste" />
                      <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        task.status === 'cleaned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{task.description}</h3>
                      <div className="text-sm text-gray-500 space-y-1 mb-4">
                        <p>Location: {task.latitude}, {task.longitude}</p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 underline"
                        >
                          View on Maps
                        </a>
                      </div>
                      
                      {task.status === 'assigned' && (
                        <div className="mt-4">
                          {selectedTask?.id === task.id ? (
                            <form onSubmit={handleComplete} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Work</label>
                                
                                {!isCameraOpen && !capturedImage && (
                                  <button
                                    type="button"
                                    onClick={startCamera}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    Open Camera
                                  </button>
                                )}

                                {isCameraOpen && (
                                  <div className="relative bg-black rounded-lg overflow-hidden min-h-[300px]">
                                    <video 
                                      ref={videoRef} 
                                      autoPlay 
                                      playsInline 
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={capturePhoto}
                                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100"
                                    >
                                      <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                                    </button>
                                  </div>
                                )}

                                <canvas ref={canvasRef} className="hidden" />

                                {capturedImage && (
                                  <div className="relative">
                                    <img 
                                      src={URL.createObjectURL(capturedImage)} 
                                      alt="Captured" 
                                      className="w-full rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => { setCapturedImage(null); startCamera(); }}
                                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                                    >
                                      Retake Photo
                                    </button>
                                  </div>
                                )}
                                
                                {location && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                  </p>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  type="submit"
                                  disabled={loading || !capturedImage || !location}
                                  className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                                >
                                  {loading ? 'Verifying...' : 'Submit Proof'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { 
                                    setSelectedTask(null); 
                                    setCapturedImage(null); 
                                    stopCamera();
                                  }}
                                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Complete Task
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Available Tasks Section */}
        {activeTab === 'available-tasks' && (
          <div>
            {availableTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks available at the moment.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {availableTasks.map((task) => (
                  <li key={task.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="relative h-48">
                      <img className="w-full h-full object-cover" src={`/${task.image_url}`} alt="Waste" />
                      <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{task.description}</h3>
                      <div className="text-sm text-gray-500 space-y-1 mb-4">
                        <p>Location: {task.latitude}, {task.longitude}</p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 underline"
                        >
                          View on Maps
                        </a>
                      </div>
                      <button
                        onClick={() => handleClaim(task.id)}
                        disabled={loading}
                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                      >
                        {loading ? 'Claiming...' : 'Claim Task'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
