import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';

const UserDashboard = () => {
  const [reports, setReports] = useState([]);
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
          
          // Reverse Geocoding using Google Maps API
          // Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual API key
          const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; 
          if (GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
            try {
              const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                setLocation(prev => ({ ...prev, address: data.results[0].formatted_address }));
              }
            } catch (error) {
              console.error("Error fetching address", error);
            }
          }
        },
        (error) => {
          console.error("Error getting location", error);
          setMessage("Could not get location. Please enable GPS.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setMessage("Geolocation is not supported by this browser.");
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
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert("Camera permission denied. Please allow camera access in your browser settings.");
      } else {
          setMessage("Error accessing camera. Please ensure permissions are granted.");
      }
      setIsCameraOpen(false);
      isCameraOpenRef.current = false;
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
      // Prepare canvas for capture
      canvas.width = 224; // Resize to model input size for speed
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      
      // Center crop to square
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
          // Send to backend for prediction using YOUR trained model
          const response = await client.post('/reports/predict', formData);
          const isGarbage = response.data.is_garbage;
          
          setIsGarbageDetected(isGarbage);
          setPredictionLabel(isGarbage ? "Garbage Detected! You can snap now." : "");
        } catch (error) {
          console.error("Prediction error", error);
        } finally {
          setIsDetecting(false);
          // Schedule next detection
          if (isCameraOpenRef.current) {
            detectionLoopRef.current = setTimeout(detectFrame, 500); // Check every 500ms
          }
        }
      }, 'image/jpeg', 0.6);
    } else {
      // Video not ready, retry soon
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
      setMessage("Image captured successfully.");
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
    formData.append('description', description);
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
      fetchReports();
    } catch (error) {
      console.error("Failed to submit report", error);
      setMessage(error.response?.data?.detail || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">My Reports</h1>
        
        <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Report Waste</h3>
          <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1">
                <textarea
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Photo</label>
              <div className="mt-1">
                {!isCameraOpen && !file && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Open Camera
                  </button>
                )}

                {isCameraOpen && (
                  <div className="relative">
                    <div className={`flex justify-center bg-black rounded-md overflow-hidden relative border-4 transition-colors duration-300 ${isGarbageDetected ? 'border-green-500' : 'border-red-500'}`}>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted
                        className="max-w-full max-h-[400px] w-auto h-auto object-contain"
                      />
                      <canvas 
                        ref={canvasRef} 
                        className="hidden"
                      />
                    </div>
                    
                    {predictionLabel && (
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-white text-sm ${isGarbageDetected ? 'bg-green-600' : 'bg-red-600'}`}>
                        {predictionLabel}
                      </div>
                    )}

                    <div className="mt-2 flex justify-center space-x-2">
                      <button
                        type="button"
                        onClick={captureImage}
                        disabled={!isGarbageDetected}
                        className={`px-4 py-2 rounded-md text-white transition-colors ${isGarbageDetected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        {isGarbageDetected ? 'Snap Photo' : 'Detecting Garbage...'}
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {file && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600 mb-2">Image captured!</p>
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Captured" 
                      className="h-48 w-auto object-cover rounded-md" 
                    />
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>
            </div>

            {location && (
              <div className="text-sm text-gray-500">
                <p>Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                {location.address && <p className="mt-1">Address: {location.address}</p>}
              </div>
            )}

            {message && <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">History</h3>
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => (
              <li key={report.id} className="py-4">
                <div className="flex space-x-3">
                  <img className="h-10 w-10 rounded-full object-cover" src={`/${report.image_url}`} alt="" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{report.description}</h3>
                      <p className="text-sm text-gray-500">{report.status}</p>
                    </div>
                    <p className="text-sm text-gray-500">Reported on {new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
