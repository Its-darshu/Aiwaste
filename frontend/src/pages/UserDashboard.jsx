import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// Icons
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HomeIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const FileIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UserIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGarbageDetected, setIsGarbageDetected] = useState(false);
  const [predictionLabel, setPredictionLabel] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isCameraOpenRef = useRef(false);
  const detectionLoopRef = useRef(null);

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
          
          // Reverse Geocoding (Mock or API)
          // For UI demo, we can just use the coordinates or a placeholder
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

  // Camera & Detection Logic (Same as before)
  const startCamera = async () => {
    setIsCameraOpen(true);
    isCameraOpenRef.current = true;
    setFile(null);
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            detectFrame();
          };
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
      isCameraOpenRef.current = false;
      alert("Camera permission denied or error accessing camera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionLoopRef.current) {
      clearTimeout(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    setIsCameraOpen(false);
    isCameraOpenRef.current = false;
    setPredictionLabel('');
    setIsDetecting(false);
  };

  const detectFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraOpenRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 224, 224);
      
      canvas.toBlob(async (blob) => {
        if (!blob || !isCameraOpenRef.current) return;
        
        setIsDetecting(true);
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        
        try {
          const response = await client.post('/reports/predict', formData);
          const isGarbage = response.data.is_garbage;
          setIsGarbageDetected(isGarbage);
          setPredictionLabel(isGarbage ? "Garbage Detected!" : "");
        } catch (error) {
          console.error("Prediction error", error);
        } finally {
          setIsDetecting(false);
          if (isCameraOpenRef.current) {
            detectionLoopRef.current = setTimeout(detectFrame, 500);
          }
        }
      }, 'image/jpeg', 0.6);
    } else {
      if (isCameraOpenRef.current) {
        detectionLoopRef.current = setTimeout(detectFrame, 100);
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
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
      setFile(capturedFile);
      stopCamera();
    }, 'image/jpeg');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !location) {
      setMessage("Please provide an image and ensure location is enabled.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('description', description || "Waste Report");
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    if (location.address) {
      formData.append('address', location.address);
    }
    formData.append('file', file);

    try {
      await client.post('/reports/', formData);
      setMessage("Report submitted successfully!");
      setDescription('');
      setFile(null);
      setShowReportModal(false);
      fetchReports();
    } catch (error) {
      console.error("Failed to submit report", error);
      setMessage(error.response?.data?.detail || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculation
  const pendingCount = reports.filter(r => r.status === 'pending' || r.status === 'assigned').length;
  const clearedCount = reports.filter(r => r.status === 'cleaned' || r.status === 'verified').length;
  const divertedCount = clearedCount * 5; // Mock calculation: 5kg per report

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="px-6 mt-6">
            <h2 className="text-2xl font-semibold text-gray-800">Good Morning, {user?.full_name?.split(' ')[0] || 'User'}</h2>
            
            {/* Report Waste Card */}
            <div className="mt-6 bg-gradient-to-br from-green-300 to-green-500 rounded-3xl p-8 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 transform rotate-12 scale-150"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                  <CameraIcon />
                </div>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="bg-white text-green-700 font-bold py-3 px-8 rounded-full shadow-md hover:bg-gray-50 transition-colors"
                >
                  Report Waste
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-yellow-100">
                <span className="text-2xl font-bold text-yellow-700">{pendingCount}</span>
                <span className="text-xs text-yellow-600 mt-1">Pending</span>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-green-100">
                <span className="text-2xl font-bold text-green-700">{clearedCount}</span>
                <span className="text-xs text-green-600 mt-1">Cleared</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-emerald-100">
                <span className="text-2xl font-bold text-emerald-700">{divertedCount}kg</span>
                <span className="text-xs text-emerald-600 mt-1">Diverted</span>
              </div>
            </div>

            {/* Village Snapshot */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Village Snapshot</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                      Goal Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-green-600">
                      85%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                  <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
                <p className="text-sm text-gray-500">85% Goal Reached</p>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="px-6 mt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Reports</h2>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports yet.</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex space-x-4">
                    <img className="h-16 w-16 rounded-lg object-cover" src={`/${report.image_url}`} alt="" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">{report.description || "Waste Report"}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.status === 'cleaned' ? 'bg-green-100 text-green-800' : 
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="px-6 mt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Profile</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="h-20 w-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-green-600">{user?.full_name?.charAt(0)}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{user?.full_name}</h3>
              <p className="text-gray-500">{user?.email}</p>
              
              <button 
                onClick={logout}
                className="mt-6 w-full bg-red-50 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        );
      default:
        return <div className="px-6 mt-6 text-center text-gray-500">Coming Soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div>
          <h1 className="text-xl font-bold text-green-800 flex items-center">
            <span className="mr-2">🌱</span> ECOSNAP
          </h1>
          <p className="text-gray-500 text-sm flex items-center mt-1">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {location?.address || "Locating..."}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <BellIcon />
          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
            <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('home')} className="flex flex-col items-center">
          <HomeIcon active={activeTab === 'home'} />
          <span className={`text-xs mt-1 ${activeTab === 'home' ? 'text-green-600' : 'text-gray-400'}`}>Home</span>
        </button>
        <button onClick={() => setActiveTab('learn')} className="flex flex-col items-center">
          <BookIcon active={activeTab === 'learn'} />
          <span className={`text-xs mt-1 ${activeTab === 'learn' ? 'text-green-600' : 'text-gray-400'}`}>Learn</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className="flex flex-col items-center">
          <FileIcon active={activeTab === 'reports'} />
          <span className={`text-xs mt-1 ${activeTab === 'reports' ? 'text-green-600' : 'text-gray-400'}`}>My Reports</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className="flex flex-col items-center">
          <UserIcon active={activeTab === 'profile'} />
          <span className={`text-xs mt-1 ${activeTab === 'profile' ? 'text-green-600' : 'text-gray-400'}`}>Profile</span>
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Report Waste</h3>
              <button onClick={() => { setShowReportModal(false); stopCamera(); }} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                  placeholder="Describe the waste..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo Evidence</label>
                {!isCameraOpen && !file && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <CameraIcon />
                    <span className="mt-2 text-sm text-gray-500">Tap to take photo</span>
                  </button>
                )}

                {isCameraOpen && (
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-64 object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {predictionLabel && (
                      <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-white text-xs font-bold ${isGarbageDetected ? 'bg-green-500' : 'bg-red-500'}`}>
                        {predictionLabel}
                      </div>
                    )}

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                      <button
                        type="button"
                        onClick={captureImage}
                        disabled={!isGarbageDetected}
                        className={`h-14 w-14 rounded-full border-4 border-white flex items-center justify-center ${isGarbageDetected ? 'bg-green-500' : 'bg-gray-400'}`}
                      >
                        <div className="h-10 w-10 bg-white rounded-full"></div>
                      </button>
                    </div>
                  </div>
                )}

                {file && (
                  <div className="relative">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Captured" 
                      className="w-full h-64 object-cover rounded-lg" 
                    />
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
