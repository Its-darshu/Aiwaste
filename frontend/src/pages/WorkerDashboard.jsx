import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';

// --- Icons ---
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const WorkerDashboard = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my-tasks'
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'camera'

  // Camera & Location State
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    // WebSocket setup for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = () => fetchTasks();
    return () => {
      ws.close();
      stopCamera();
    };
  }, []);

  // Camera effect
  useEffect(() => {
    if (viewMode === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [viewMode]);

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
        (error) => reject(error),
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
      setViewMode('camera');
      setCapturedImage(null);
      getLocation().catch(() => setMessage("Could not get location."));
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage("Error accessing camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
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
        // Stay in camera view but show preview state (handled in render)
      }, 'image/jpeg', 0.8);
    }
  };

  const handleClaim = async () => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      await client.post(`/tasks/${selectedTask.id}/claim`);
      setMessage("Task claimed!");
      await fetchTasks();
      setActiveTab('my-tasks');
      setViewMode('list');
      setSelectedTask(null);
    } catch (error) {
      setMessage("Failed to claim task.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCleaned = async () => {
    if (!capturedImage || !selectedTask || !location) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', capturedImage, 'cleanup.jpg');
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);

    try {
      await client.post(`/tasks/${selectedTask.id}/complete`, formData);
      setMessage("Task completed!");
      await fetchTasks();
      setViewMode('list');
      setSelectedTask(null);
      setCapturedImage(null);
    } catch (error) {
      setMessage("Failed to complete task.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---

  const renderList = (tasks) => (
    <div className="space-y-4 pb-20">
      {tasks.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No tasks found.</div>
      ) : (
        tasks.map(task => (
          <div 
            key={task.id}
            onClick={() => { setSelectedTask(task); setViewMode('detail'); }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-95 transition-transform cursor-pointer flex h-28"
          >
            {/* Thumbnail */}
            <div className="w-28 h-full bg-gray-200 flex-shrink-0 relative">
               <img src={`/${task.image_url}`} alt="" className="w-full h-full object-cover" />
               {/* Video Indicator (Mock) */}
               <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                 <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                 </div>
               </div>
            </div>
            {/* Content */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                {task.complaint_id && <div className="text-[10px] font-mono text-gray-400 mb-0.5">#{task.complaint_id}</div>}
                <h3 className="font-bold text-gray-800 line-clamp-1">{task.description}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <MapPinIcon />
                  <span className="ml-1 truncate">Lat: {task.latitude.toFixed(4)}, Lng: {task.longitude.toFixed(4)}</span>
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  task.status === 'cleaned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {task.status}
                </span>
                <span className="text-xs text-gray-400">Tap to view</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // --- Main Render ---

  if (viewMode === 'camera') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          {!capturedImage ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <button 
                onClick={() => { stopCamera(); setViewMode('detail'); }}
                className="absolute top-4 left-4 text-white p-2 bg-black/40 rounded-full"
              >
                <ChevronLeftIcon />
              </button>
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center"
                >
                  <div className="w-16 h-16 bg-red-500 rounded-full"></div>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full relative bg-black flex flex-col items-center justify-center">
              <img src={URL.createObjectURL(capturedImage)} alt="Preview" className="max-h-[80vh] max-w-full" />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/80 flex justify-between items-center">
                <button 
                  onClick={() => { setCapturedImage(null); startCamera(); }}
                  className="text-white font-medium"
                >
                  Retake
                </button>
                <button 
                  onClick={handleSubmitCleaned}
                  disabled={loading}
                  className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"
                >
                  {loading ? 'Uploading...' : 'Submit Cleaned'}
                </button>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (viewMode === 'detail' && selectedTask) {
    return (
      <div className="fixed inset-0 bg-white z-40 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          <button onClick={() => setViewMode('list')} className="text-white p-2 bg-white/20 backdrop-blur-md rounded-full">
            <ChevronLeftIcon />
          </button>
        </div>

        {/* Large Media View */}
        <div className="w-full h-[50vh] bg-gray-900 relative flex-shrink-0">
          <img src={`/${selectedTask.image_url}`} alt="Detail" className="w-full h-full object-cover" />
          {/* Mock Video Controls */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition">
              <PlayIcon />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
            <div className="w-1/3 h-full bg-green-500"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 bg-white -mt-6 rounded-t-[30px] relative z-20 flex flex-col">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
          
          {selectedTask.complaint_id && <div className="text-xs font-mono text-gray-400 mb-1">#{selectedTask.complaint_id}</div>}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.description}</h2>
          <p className="text-gray-500 mb-6 flex items-center">
            <MapPinIcon />
            <span className="ml-2">Lat: {selectedTask.latitude}, Lng: {selectedTask.longitude}</span>
          </p>

          {/* Direction Button */}
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask.latitude},${selectedTask.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold flex items-center justify-center mb-6 hover:bg-blue-100 transition"
          >
            <MapPinIcon />
            <span className="ml-2">Get Directions</span>
          </a>

          <div className="mt-auto space-y-4">
            {/* Action Buttons */}
            {activeTab === 'available' ? (
              <button 
                onClick={handleClaim}
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] transition-transform"
              >
                {loading ? 'Accepting...' : 'Accept Task'}
              </button>
            ) : (
              <button 
                onClick={startCamera}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <CameraIcon />
                <span className="ml-2">Submit Cleaned</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm sticky top-0 z-30">
        <h1 className="text-2xl font-extrabold text-gray-900">Worker Dashboard</h1>
        <p className="text-sm text-gray-500">Manage your cleanup tasks</p>
      </div>

      {/* Tabs */}
      <div className="flex p-4 space-x-4 sticky top-[88px] z-20 bg-gray-50/95 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'available' 
              ? 'bg-black text-white shadow-lg' 
              : 'bg-white text-gray-500 border border-gray-200'
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setActiveTab('my-tasks')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'my-tasks' 
              ? 'bg-black text-white shadow-lg' 
              : 'bg-white text-gray-500 border border-gray-200'
          }`}
        >
          My Tasks
        </button>
      </div>

      {/* Task List */}
      <div className="px-4">
        {message && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm flex justify-between">
            {message}
            <button onClick={() => setMessage('')}>&times;</button>
          </div>
        )}
        
        {activeTab === 'available' ? renderList(availableTasks) : renderList(myTasks)}
      </div>
    </div>
  );
};

export default WorkerDashboard;
