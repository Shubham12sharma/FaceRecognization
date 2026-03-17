import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, UserCheck, AlertCircle, Loader,
    RefreshCw, Settings, History, TrendingUp,
    CheckCircle, XCircle, Eye, Download,
    Maximize2, Minimize2, Volume2, VolumeX,
    Activity, Fingerprint, Shield, Zap, User
} from 'lucide-react';

const RecognitionPage = () => {
    const webcamRef = useRef(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [sound, setSound] = useState(true);
    const [recognitionHistory, setRecognitionHistory] = useState([]);
    const [cameraDevices, setCameraDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [confidenceThreshold, setConfidenceThreshold] = useState(80);
    const [autoCapture, setAutoCapture] = useState(false);
    const [fps, setFps] = useState(0);
    const [lastFrameTime, setLastFrameTime] = useState(Date.now());
    const [captureCount, setCaptureCount] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [imageQuality, setImageQuality] = useState(0.92);
    const [faceDetected, setFaceDetected] = useState(false);

    // Load camera devices
    useEffect(() => {
        checkCameraPermission();
    }, []);

    const checkCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraPermission(true);
            setCameraEnabled(true);

            // Stop all tracks after permission check
            stream.getTracks().forEach(track => track.stop());

            // Get available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameraDevices(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedDevice(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error('Camera permission error:', err);
            setCameraPermission(false);
            setCameraEnabled(false);
            toast.error('Camera access denied. Please enable camera permissions.');
        }
    };

    // Auto capture mode
    useEffect(() => {
        let interval;
        if (autoCapture && !loading && cameraEnabled) {
            interval = setInterval(() => {
                captureAndRecognize();
            }, 3000); // Capture every 3 seconds
        }
        return () => clearInterval(interval);
    }, [autoCapture, loading, cameraEnabled]);

    // Calculate FPS
    useEffect(() => {
        const interval = setInterval(() => {
            if (webcamRef.current) {
                const now = Date.now();
                const diff = now - lastFrameTime;
                const calculatedFps = Math.round(1000 / Math.max(diff, 1));
                setFps(calculatedFps);
                setLastFrameTime(now);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastFrameTime]);

    // Simulate face detection (this would be replaced with actual face detection)
    useEffect(() => {
        if (webcamRef.current && cameraEnabled) {
            const interval = setInterval(() => {
                // This is a placeholder - in real implementation, you'd use a face detection library
                setFaceDetected(Math.random() > 0.3); // Simulate 70% detection rate
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [cameraEnabled]);

    const captureAndRecognize = async () => {
        if (!webcamRef.current || loading) return;

        setLoading(true);

        try {
            // Capture image from webcam
            const imageSrc = webcamRef.current.getScreenshot({
                width: 640,
                height: 480
            });

            if (!imageSrc) {
                throw new Error('Failed to capture image');
            }

            // Get token
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.error('Please login again');
                window.location.href = '/login';
                return;
            }

            // Send to backend
            const response = await axios.post(
                'http://127.0.0.1:8000/api/recognize/',
                {
                    image: imageSrc,
                    threshold: confidenceThreshold
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            const data = response.data;

            if (data.recognized) {
                const studentData = {
                    id: data.student?.id || data.student_id,
                    name: data.name || data.student?.name || 'Unknown',
                    roll_no: data.roll_no || data.student?.roll_no || '-',
                    department: data.department || data.student?.department_name || '-',
                    confidence: data.confidence,
                    timestamp: new Date().toLocaleTimeString(),
                    date: new Date().toLocaleDateString(),
                    photo: data.student?.photo
                };

                setResult(studentData);

                // Add to history
                setRecognitionHistory(prev => [studentData, ...prev].slice(0, 10));

                // Play success sound
                if (sound) {
                    playSound('success');
                }

                toast.success(`Welcome, ${studentData.name}!`, {
                    icon: '✅',
                    duration: 3000,
                    position: 'top-right'
                });

                setCaptureCount(prev => prev + 1);
            } else {
                setResult(null);

                // Play error sound
                if (sound) {
                    playSound('error');
                }

                toast.error(data.message || "Face Not Recognized", {
                    icon: '❌',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Recognition error:', error);

            let errorMessage = "Failed to recognize face";

            if (error.code === 'ECONNABORTED') {
                errorMessage = "Request timeout - server not responding";
            } else if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "Session expired. Please login again";
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else if (error.response.status === 500) {
                    errorMessage = "Server error. Please try again";
                } else {
                    errorMessage = error.response.data?.error || errorMessage;
                }
            } else if (error.request) {
                errorMessage = "Cannot connect to server. Make sure Django is running on port 8000";
            }

            toast.error(errorMessage, {
                duration: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const playSound = (type) => {
        try {
            const audio = new Audio(type === 'success'
                ? 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'
                : 'https://www.soundjay.com/misc/sounds/buzzer-or-wrong-answer-01.mp3'
            );
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Sound play failed:', e));
        } catch (e) {
            console.log('Sound not supported');
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setFullscreen(true);
        } else {
            document.exitFullscreen();
            setFullscreen(false);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 90) return 'text-green-600';
        if (confidence >= 75) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getConfidenceBg = (confidence) => {
        if (confidence >= 90) return 'bg-green-100';
        if (confidence >= 75) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const handleRetryCamera = () => {
        setCameraEnabled(true);
        checkCameraPermission();
    };

    const handleDeviceChange = (deviceId) => {
        setSelectedDevice(deviceId);
        // Small delay to let camera initialize
        setTimeout(() => {
            toast.success('Camera switched');
        }, 500);
    };

    const handleDownloadResult = () => {
        if (!result) return;

        const data = {
            ...result,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recognition_${result.name}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Result downloaded');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Camera className="text-gray-900" />
                        Live Face Recognition
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Real-time face detection and attendance marking
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <Activity size={16} className="text-gray-600" />
                        <span className="text-xs font-medium text-gray-600">{fps} FPS</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                        <Camera size={16} className="text-gray-600" />
                        <span className="text-xs font-medium text-gray-600">{captureCount} captures</span>
                    </div>
                    <button
                        onClick={() => setSound(!sound)}
                        className={`p-2 rounded-lg transition-colors ${sound ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
                            }`}
                        title={sound ? 'Mute sound' : 'Unmute sound'}
                    >
                        {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                        title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recognition Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">
                                        Confidence Threshold
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="50"
                                            max="98"
                                            step="1"
                                            value={confidenceThreshold}
                                            onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-medium text-gray-900 min-w-[45px]">
                                            {confidenceThreshold}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Minimum confidence to accept recognition
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">
                                        Image Quality
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1"
                                            step="0.1"
                                            value={imageQuality}
                                            onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-medium text-gray-900 min-w-[45px]">
                                            {Math.round(imageQuality * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Higher quality = larger image size
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">
                                        Camera Selection
                                    </label>
                                    {cameraDevices.length > 0 ? (
                                        <select
                                            value={selectedDevice || ''}
                                            onChange={(e) => handleDeviceChange(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        >
                                            {cameraDevices.map((device, index) => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Camera ${index + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-gray-400">No cameras found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Camera Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* Camera Controls */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${cameraEnabled && faceDetected ? 'bg-green-500' : 'bg-gray-400'
                                            }`}></div>
                                        <span className="text-xs font-medium text-gray-600">
                                            {cameraEnabled ? (faceDetected ? 'Face Detected' : 'No Face') : 'Camera Off'}
                                        </span>
                                    </div>
                                    {cameraDevices.length > 1 && (
                                        <select
                                            value={selectedDevice || ''}
                                            onChange={(e) => handleDeviceChange(e.target.value)}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                                        >
                                            {cameraDevices.map((device, index) => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Camera ${index + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoCapture}
                                            onChange={(e) => setAutoCapture(e.target.checked)}
                                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                        />
                                        Auto Capture (3s)
                                    </label>
                                    <button
                                        onClick={captureAndRecognize}
                                        disabled={loading || !cameraEnabled}
                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader size={16} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Camera size={16} />
                                                Capture & Recognize
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Webcam */}
                        <div className="relative bg-gray-900 aspect-video">
                            {cameraEnabled && cameraPermission ? (
                                <Webcam
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    screenshotQuality={imageQuality}
                                    className="w-full h-full object-cover"
                                    videoConstraints={{
                                        deviceId: selectedDevice,
                                        facingMode: "user",
                                        width: { ideal: 1280 },
                                        height: { ideal: 720 }
                                    }}
                                    onUserMedia={() => {
                                        setCameraEnabled(true);
                                        toast.success('Camera connected');
                                    }}
                                    onUserMediaError={(err) => {
                                        console.error('Camera error:', err);
                                        setCameraEnabled(false);
                                        toast.error("Camera access denied or not available");
                                    }}
                                    mirrored={true}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-800">
                                    <Camera size={48} className="mb-4 opacity-50" />
                                    <p className="text-sm mb-2">Camera not available</p>
                                    <p className="text-xs text-gray-500 mb-4">
                                        {!cameraPermission ? 'Camera permission denied' : 'Please connect a camera'}
                                    </p>
                                    <button
                                        onClick={handleRetryCamera}
                                        className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw size={14} />
                                        Retry Camera
                                    </button>
                                </div>
                            )}

                            {/* Overlay */}
                            {cameraEnabled && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-4 left-4">
                                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                            <Fingerprint size={14} className="text-white/80" />
                                            <span className="text-xs text-white/80">
                                                {faceDetected ? 'Face Detected' : 'Searching for face...'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                            <span className="text-xs text-white/80">Threshold: {confidenceThreshold}%</span>
                                        </div>
                                    </div>

                                    {/* Face detection guide - visible when no face detected */}
                                    {!faceDetected && (
                                        <div className="absolute inset-[20%] border-2 border-white/30 rounded-2xl animate-pulse"></div>
                                    )}

                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                        <p className="text-xs text-white/60 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                            {faceDetected
                                                ? 'Face detected - click capture'
                                                : 'Position your face within the frame'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confidence Threshold Slider */}
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-medium text-gray-600 min-w-[100px]">
                                    Confidence Threshold
                                </span>
                                <input
                                    type="range"
                                    min="50"
                                    max="98"
                                    step="1"
                                    value={confidenceThreshold}
                                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                                    {confidenceThreshold}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Lower threshold = more recognitions but lower accuracy
                            </p>
                        </div>
                    </div>

                    {/* Recognition History */}
                    {recognitionHistory.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <History size={16} />
                                Recent Recognitions
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {recognitionHistory.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                {item.photo ? (
                                                    <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {item.name?.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.timestamp}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.confidence >= 90 ? 'bg-green-100 text-green-700' :
                                                    item.confidence >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {item.confidence}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recognition Result */}
                <div className="lg:col-span-1">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4"
                            >
                                {/* Success Header */}
                                <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={20} className="text-green-600" />
                                        <span className="text-sm font-medium text-green-700">Recognition Successful</span>
                                    </div>
                                </div>

                                {/* Student Info */}
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">
                                            {result.photo ? (
                                                <img src={result.photo} alt={result.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={32} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{result.name}</h2>
                                            <p className="text-sm text-gray-500">ID: {result.id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-500">Roll Number</span>
                                            <span className="text-sm font-medium text-gray-900">{result.roll_no}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-500">Department</span>
                                            <span className="text-sm font-medium text-gray-900">{result.department}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-500">Time</span>
                                            <span className="text-sm font-medium text-gray-900">{result.timestamp}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-500">Date</span>
                                            <span className="text-sm font-medium text-gray-900">{result.date}</span>
                                        </div>

                                        {/* Confidence Score */}
                                        <div className="mt-4 p-4 rounded-xl bg-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600">Confidence Score</span>
                                                <span className={`text-lg font-bold ${getConfidenceColor(result.confidence)}`}>
                                                    {result.confidence}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${result.confidence}%` }}
                                                    transition={{ duration: 0.5 }}
                                                    className={`h-full ${result.confidence >= 90 ? 'bg-green-500' :
                                                            result.confidence >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <button
                                                onClick={() => {/* View details */ }}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Eye size={16} />
                                                View Details
                                            </button>
                                            <button
                                                onClick={handleDownloadResult}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Download size={16} />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="no-result"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white rounded-xl border border-gray-200 p-8 text-center sticky top-4"
                            >
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Face Detected</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Position yourself in front of the camera and click the capture button
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Zap size={14} />
                                        <span>Ensure good lighting</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Shield size={14} />
                                        <span>Remove glasses or mask if needed</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Camera size={14} />
                                        <span>Look directly at the camera</span>
                                    </div>
                                </div>

                                {!cameraEnabled && (
                                    <button
                                        onClick={handleRetryCamera}
                                        className="mt-6 w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={16} />
                                        Enable Camera
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Total Recognitions</p>
                        <p className="text-lg font-semibold text-gray-900">{captureCount}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Success Rate</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {captureCount > 0 ? Math.round((recognitionHistory.length / captureCount) * 100) : 0}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Avg Confidence</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {recognitionHistory.length > 0
                                ? Math.round(recognitionHistory.reduce((acc, curr) => acc + curr.confidence, 0) / recognitionHistory.length)
                                : 0}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Camera Status</p>
                        <p className={`text-sm font-medium ${cameraEnabled ? 'text-green-600' : 'text-red-600'}`}>
                            {cameraEnabled ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecognitionPage;