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
    Activity, Fingerprint, Shield, Zap
} from 'lucide-react';

const RecognitionPage = () => {
    const webcamRef = useRef(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);
    const [sound, setSound] = useState(true);
    const [recognitionHistory, setRecognitionHistory] = useState([]);
    const [cameraDevices, setCameraDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [confidenceThreshold, setConfidenceThreshold] = useState(75);
    const [autoCapture, setAutoCapture] = useState(false);
    const [fps, setFps] = useState(0);
    const [lastFrameTime, setLastFrameTime] = useState(Date.now());

    // Load camera devices
    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameraDevices(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Error getting cameras:', err);
            }
        };
        getCameras();
    }, []);

    // Auto capture mode
    useEffect(() => {
        let interval;
        if (autoCapture && !loading) {
            interval = setInterval(() => {
                captureAndRecognize();
            }, 5000); // Capture every 5 seconds
        }
        return () => clearInterval(interval);
    }, [autoCapture, loading]);

    // Calculate FPS
    useEffect(() => {
        const interval = setInterval(() => {
            if (webcamRef.current) {
                const now = Date.now();
                const diff = now - lastFrameTime;
                setFps(Math.round(1000 / diff));
                setLastFrameTime(now);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastFrameTime]);

    const captureAndRecognize = async () => {
        if (!webcamRef.current || loading) return;

        setLoading(true);
        const imageSrc = webcamRef.current.getScreenshot();

        try {
            const res = await axios.post('http://127.0.0.1:8000/api/recognize/',
                {
                    image: imageSrc,
                    threshold: confidenceThreshold / 100
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (res.data.recognized) {
                const studentData = {
                    ...res.data.student,
                    timestamp: new Date().toLocaleTimeString(),
                    confidence: res.data.student.confidence
                };

                setResult(studentData);

                // Add to history
                setRecognitionHistory(prev => [studentData, ...prev].slice(0, 10));

                // Play sound if enabled
                if (sound) {
                    const audio = new Audio('/success.mp3');
                    audio.play().catch(() => { });
                }

                toast.success(`Welcome, ${res.data.student.name}!`, {
                    icon: '✅',
                    duration: 3000
                });
            } else {
                setResult(null);
                if (sound) {
                    const audio = new Audio('/error.mp3');
                    audio.play().catch(() => { });
                }
                toast.error("Face Not Recognized", {
                    icon: '❌',
                    duration: 2000
                });
            }
        } catch (err) {
            toast.error("Server Connection Error", {
                description: "Make sure Django server is running on port 8000"
            });
        }
        setLoading(false);
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
        if (confidence >= 90) return 'bg-green-50';
        if (confidence >= 75) return 'bg-yellow-50';
        return 'bg-red-50';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
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
                    <button
                        onClick={() => setSound(!sound)}
                        className={`p-2 rounded-lg transition-colors ${sound ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
                            }`}
                    >
                        {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Camera Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* Camera Controls */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-medium text-gray-600">Camera Active</span>
                                    </div>
                                    {cameraDevices.length > 1 && (
                                        <select
                                            value={selectedDevice || ''}
                                            onChange={(e) => setSelectedDevice(e.target.value)}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                                        >
                                            {cameraDevices.map((device, index) => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    Camera {index + 1}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-xs text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={autoCapture}
                                            onChange={(e) => setAutoCapture(e.target.checked)}
                                            className="rounded border-gray-300"
                                        />
                                        Auto Capture
                                    </label>
                                    <button
                                        onClick={captureAndRecognize}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader size={16} className="animate-spin" />
                                        ) : (
                                            <Camera size={16} />
                                        )}
                                        {loading ? 'Processing...' : 'Capture & Recognize'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Webcam */}
                        <div className="relative bg-gray-900 aspect-video">
                            {cameraEnabled ? (
                                <Webcam
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover"
                                    videoConstraints={{
                                        deviceId: selectedDevice,
                                        facingMode: "user",
                                        width: 1280,
                                        height: 720
                                    }}
                                    onUserMediaError={() => {
                                        setCameraEnabled(false);
                                        toast.error("Camera access denied");
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <Camera size={48} className="mb-4 opacity-50" />
                                    <p className="text-sm">Camera not available</p>
                                    <button
                                        onClick={() => setCameraEnabled(true)}
                                        className="mt-4 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-4 left-4">
                                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                        <Fingerprint size={14} className="text-white/80" />
                                        <span className="text-xs text-white/80">Face Detection Active</span>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                        <span className="text-xs text-white/80">Threshold: {confidenceThreshold}%</span>
                                    </div>
                                </div>

                                {/* Face detection guide */}
                                <div className="absolute inset-[20%] border-2 border-white/30 rounded-2xl"></div>
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <p className="text-xs text-white/60 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                        Position your face within the frame
                                    </p>
                                </div>
                            </div>
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
                                    max="95"
                                    value={confidenceThreshold}
                                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                                    {confidenceThreshold}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recognition History */}
                    {recognitionHistory.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <History size={16} />
                                Recent Recognitions
                            </h3>
                            <div className="space-y-2">
                                {recognitionHistory.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {item.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.timestamp}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.confidence >= 90 ? 'bg-green-50 text-green-700' :
                                                    item.confidence >= 75 ? 'bg-yellow-50 text-yellow-700' :
                                                        'bg-red-50 text-red-700'
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
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
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
                                        <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center">
                                            <span className="text-2xl font-bold text-gray-600">
                                                {result.name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{result.name}</h2>
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
                                            <span className="text-sm font-medium text-gray-900">{new Date().toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-500">Date</span>
                                            <span className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
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
                                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                                <Eye size={16} />
                                                View Details
                                            </button>
                                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
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
                                className="bg-white rounded-xl border border-gray-200 p-8 text-center"
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
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default RecognitionPage;