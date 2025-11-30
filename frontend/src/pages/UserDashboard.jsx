import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// --- Icons ---
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HomeIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors duration-300 ${active ? 'text-emerald-500' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors duration-300 ${active ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const FileIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors duration-300 ${active ? 'text-emerald-500' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UserIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors duration-300 ${active ? 'text-emerald-500' : 'text-gray-400'}`} fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Report Form State
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [isGarbage, setIsGarbage] = useState(false);
  const [predictionLabel, setPredictionLabel] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isCapturingRef = useRef(false);
  const predictionTimeoutRef = useRef(null);

  useEffect(() => {
    fetchReports();
    getLocation();
    return () => stopCamera();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          // Mock reverse geocoding for demo
          setLocation(prev => ({ ...prev, address: "Rampur Village" }));
        },
        (error) => {
          console.error("Error getting location", error);
          setMessage("Could not get location. Please enable GPS.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const fetchReports = async () => {
    try {
      const response = await client.get('/reports/my');
      setReports(response.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    isCapturingRef.current = true;
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      
      // Small delay to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            predictFrame();
          };
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowCamera(false);
      isCapturingRef.current = false;
      alert("Camera permission denied or error accessing camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
      predictionTimeoutRef.current = null;
    }
    setShowCamera(false);
    isCapturingRef.current = false;
    setPredictionLabel('');
    setIsPredicting(false);
  };

  const predictFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isCapturingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      
      // Center crop
      const minSize = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minSize) / 2;
      const startY = (video.videoHeight - minSize) / 2;

      ctx.drawImage(video, startX, startY, minSize, minSize, 0, 0, 224, 224);

      canvas.toBlob(async (blob) => {
        if (!blob || !isCapturingRef.current) return;
        
        setIsPredicting(true);
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        try {
          const response = await client.post('/reports/predict', formData);
          const isGarbageDetected = response.data.is_garbage;
          setIsGarbage(isGarbageDetected);
          setPredictionLabel(isGarbageDetected ? "Garbage Detected!" : "");
        } catch (error) {
          console.error("Prediction error", error);
        } finally {
          setIsPredicting(false);
          if (isCapturingRef.current) {
            predictionTimeoutRef.current = setTimeout(predictFrame, 500); // Predict every 500ms
          }
        }
      }, 'image/jpeg', 0.6);
    } else {
      if (isCapturingRef.current) {
        predictionTimeoutRef.current = setTimeout(predictFrame, 100);
      }
    }
  };

  const captureImage = (e) => {
    e.preventDefault();
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      setMediaFiles(prev => [...prev, file]);
      stopCamera();
    }, 'image/jpeg');
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mediaFiles.length === 0 || !location) {
      setMessage("Please provide at least one image/video and ensure location is enabled.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('description', description || "Waste Report");
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    if (location.address) formData.append('address', location.address);
    
    mediaFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await client.post('/reports/', formData);
      setMessage("Report submitted successfully!");
      setDescription('');
      setMediaFiles([]);
      setShowReportModal(false);
      fetchReports();
    } catch (error) {
      console.error("Failed to submit report", error);
      setMessage(error.response?.data?.detail || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const pendingCount = reports.filter(r => r.status === 'pending' || r.status === 'assigned').length;
  const cleanedCount = reports.filter(r => r.status === 'cleaned' || r.status === 'verified').length;
  const divertedWaste = cleanedCount * 5; // Mock calculation

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="px-6 pb-24 animate-fade-in">
            {/* Greeting Card */}
            <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full transform translate-x-10 -translate-y-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300 opacity-20 rounded-full transform -translate-x-10 translate-y-10 blur-xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Hi, {user?.full_name?.split(' ')[0] || 'User'}! 👋</h2>
                <p className="text-emerald-100 mb-6">Let's keep our village clean together.</p>
                
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="bg-white text-emerald-600 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-emerald-50 hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <CameraIcon />
                  <span className="text-lg text-emerald-700">Report Waste</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">⏳</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">{pendingCount}</span>
                <span className="text-xs text-gray-500 font-medium">Pending</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">✅</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">{cleanedCount}</span>
                <span className="text-xs text-gray-500 font-medium">Cleared</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl">♻️</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">{divertedWaste}kg</span>
                <span className="text-xs text-gray-500 font-medium">Diverted</span>
              </div>
            </div>

            {/* Village Snapshot */}
            <div className="mt-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-emerald-50">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🏘️</span> Village Snapshot
              </h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-emerald-600 bg-emerald-100">
                      Cleanliness Goal
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold inline-block text-emerald-600">
                      85%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-emerald-100">
                  <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-500">Great job! We are close to our monthly goal.</p>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="px-6 pb-24 mt-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Reports</h2>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No reports yet. Start by reporting waste!</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex space-x-4 hover:shadow-md transition-all">
                    <img className="h-20 w-20 rounded-xl object-cover shadow-sm" src={`/${report.image_url}`} alt="" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            {report.complaint_id && (
                              <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mb-1 inline-block">
                                #{report.complaint_id}
                              </span>
                            )}
                            <h3 className="font-bold text-gray-800 line-clamp-1">{report.description || "Waste Report"}</h3>
                          </div>
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            report.status === 'cleaned' ? 'bg-emerald-100 text-emerald-700' : 
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <span className="mr-1">📍</span> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 text-right">{new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="px-6 pb-24 mt-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              <div className="relative -mt-12 mb-4">
                <div className="h-24 w-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-md p-1">
                  <div className="h-full w-full bg-emerald-100 rounded-full flex items-center justify-center text-3xl font-bold text-emerald-600">
                    {user?.full_name?.charAt(0)}
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">{user?.full_name}</h3>
              <p className="text-gray-500 mb-6">{user?.email}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase">Reports</p>
                  <p className="text-lg font-bold text-gray-800">{reports.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase">Impact</p>
                  <p className="text-lg font-bold text-gray-800">High</p>
                </div>
              </div>

              <button 
                onClick={logout}
                className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
              >
                <span className="mr-2">🚪</span> Logout
              </button>
            </div>
          </div>
        );
      default:
        return <div className="px-6 mt-6 text-center text-gray-500">Coming Soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-emerald-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-6 pt-12 pb-4 flex justify-between items-center shadow-sm sticky top-0 z-40 transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center">
            <span className="mr-2 text-2xl">🌱</span> ECOSNAP
          </h1>
          <p className="text-gray-500 text-xs font-medium flex items-center mt-1 bg-gray-100 px-2 py-1 rounded-full w-fit">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {location?.address || "Locating..."}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
            <BellIcon />
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 cursor-pointer">
            <div className="h-full w-full bg-white rounded-full flex items-center justify-center overflow-hidden">
               <span className="font-bold text-emerald-700">{user?.full_name?.charAt(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl px-6 py-4 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('home')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'home' ? 'bg-emerald-50 scale-110' : 'group-hover:bg-gray-50'}`}>
            <HomeIcon active={activeTab === 'home'} />
          </div>
        </button>
        <button onClick={() => setActiveTab('learn')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'learn' ? 'bg-emerald-50 scale-110' : 'group-hover:bg-gray-50'}`}>
            <BookIcon active={activeTab === 'learn'} />
          </div>
        </button>
        <button onClick={() => setActiveTab('reports')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'reports' ? 'bg-emerald-50 scale-110' : 'group-hover:bg-gray-50'}`}>
            <FileIcon active={activeTab === 'reports'} />
          </div>
        </button>
        <button onClick={() => setActiveTab('profile')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'profile' ? 'bg-emerald-50 scale-110' : 'group-hover:bg-gray-50'}`}>
            <UserIcon active={activeTab === 'profile'} />
          </div>
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Report Waste</h3>
              <button onClick={() => { setShowReportModal(false); stopCamera(); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea 
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-none"
                  placeholder="Describe the waste location and type..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Photo Evidence</label>
                
                {!showCamera && (
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                        <button 
                            type="button"
                            onClick={startCamera}
                            className="flex-1 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-emerald-100 transition-colors group"
                        >
                            <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="font-bold text-emerald-700 text-sm">Take Photo</span>
                        </button>
                        
                        <label className="flex-1 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-blue-100 transition-colors group cursor-pointer">
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*,video/*" 
                                onChange={handleFileChange} 
                                className="hidden" 
                            />
                            <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="font-bold text-blue-700 text-sm">Upload Files</span>
                        </label>
                    </div>

                    {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {mediaFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                    {file.type.startsWith('video') ? (
                                        <video src={URL.createObjectURL(file)} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                                    ) : (
                                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                                    )}
                                    <button 
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                )}

                {showCamera && (
                  <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {predictionLabel && (
                      <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg backdrop-blur-md ${isGarbage ? 'bg-red-500/90' : 'bg-emerald-500/90'}`}>
                        {predictionLabel}
                      </div>
                    )}
                    
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                      <button 
                        type="button"
                        onClick={captureImage}
                        disabled={!isGarbage}
                        className={`h-20 w-20 rounded-full border-4 border-white/50 flex items-center justify-center transition-all ${isGarbage ? 'bg-emerald-500 hover:scale-110 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        <div className="h-16 w-16 bg-white rounded-full"></div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
