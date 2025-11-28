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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchReports();
    getLocation();
    return () => stopCamera();
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location", error);
          setMessage("Could not get location. Please enable GPS.");
        }
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
    setFile(null);
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // Start prediction loop
      intervalRef.current = setInterval(detectFrame, 1000);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage("Error accessing camera. Please ensure permissions are granted.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCameraOpen(false);
    setPredictionLabel('');
  };

  const detectFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        
        try {
          const response = await client.post('/reports/predict', formData);
          const isGarbage = response.data.is_garbage;
          setIsGarbageDetected(isGarbage);
          setPredictionLabel(isGarbage ? "Garbage Detected! You can snap now." : "No Garbage Detected.");
        } catch (error) {
          console.error("Prediction error", error);
        }
      }, 'image/jpeg', 0.7);
    }
  };

  const captureImage = (e) => {
    e.preventDefault();
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
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
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-64 object-cover rounded-md bg-black"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-white text-sm ${isGarbageDetected ? 'bg-green-600' : 'bg-red-600'}`}>
                      {predictionLabel || "Initializing..."}
                    </div>

                    <div className="mt-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={captureImage}
                        disabled={!isGarbageDetected}
                        className={`px-4 py-2 rounded-md text-white ${isGarbageDetected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        Snap Photo
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
              <p className="text-sm text-gray-500">
                Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
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
                  <img className="h-10 w-10 rounded-full object-cover" src={`http://localhost:8000/${report.image_url}`} alt="" />
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
