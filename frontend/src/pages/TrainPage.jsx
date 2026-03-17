import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, Loader2, Brain, Settings, History,
    TrendingUp, AlertCircle, CheckCircle, Clock,
    BarChart3, Database, Cpu, RefreshCw, Download,
    Play, Pause, StopCircle, Info, FileText,
    Layers, Target, Zap, Shield, Eye
} from 'lucide-react';
import { ChevronDown } from 'lucide-react'
const TrainPage = () => {
    const [loading, setLoading] = useState(false);
    const [trainingHistory, setTrainingHistory] = useState([]);
    const [modelInfo, setModelInfo] = useState(null);
    const [datasetStats, setDatasetStats] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState(null);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('lbph');
    const [hyperparameters, setHyperparameters] = useState({
        radius: 1,
        neighbors: 8,
        gridX: 8,
        gridY: 8,
        confidenceThreshold: 80,
        testSplit: 0.2,
        epochs: 100,
        batchSize: 32
    });
    const [validationResults, setValidationResults] = useState(null);
    const [logs, setLogs] = useState([]);

    const algorithms = [
        { id: 'lbph', name: 'LBPH (Local Binary Patterns)', description: 'Best for real-time face recognition', accuracy: '94%', speed: 'Fast' },
        { id: 'eigen', name: 'Eigenfaces (PCA)', description: 'Principal Component Analysis based', accuracy: '89%', speed: 'Medium' },
        { id: 'fisher', name: 'Fisherfaces (LDA)', description: 'Linear Discriminant Analysis', accuracy: '91%', speed: 'Medium' },
        { id: 'cnn', name: 'Deep Learning (CNN)', description: 'Neural network based recognition', accuracy: '97%', speed: 'Slow' }
    ];

    useEffect(() => {
        fetchModelInfo();
        fetchDatasetStats();
        fetchTrainingHistory();
    }, []);

    const fetchModelInfo = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/model/info/');
            setModelInfo(res.data);
        } catch (err) {
            console.log('No existing model found');
        }
    };

    const fetchDatasetStats = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/dataset/stats/');
            setDatasetStats(res.data);
        } catch (err) {
            toast.error('Could not fetch dataset statistics');
        }
    };

    const fetchTrainingHistory = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/training/history/');
            setTrainingHistory(res.data);
        } catch (err) {
            console.log('No training history found');
        }
    };

    const handleTrain = async () => {
        setLoading(true);
        setTrainingProgress(0);
        setLogs([]);

        // Simulate progress (replace with actual SSE or WebSocket)
        const progressInterval = setInterval(() => {
            setTrainingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 10;
            });
        }, 1000);

        try {
            const res = await axios.post('http://127.0.0.1:8000/api/train/', {
                algorithm: selectedAlgorithm,
                hyperparameters: hyperparameters
            });

            clearInterval(progressInterval);
            setTrainingProgress(100);

            toast.success(res.data.message || "Training Completed Successfully!", {
                duration: 6000,
                icon: '🎉'
            });

            // Refresh data
            fetchModelInfo();
            fetchDatasetStats();
            fetchTrainingHistory();

            // Set validation results
            if (res.data.validation) {
                setValidationResults(res.data.validation);
            }

        } catch (err) {
            clearInterval(progressInterval);
            toast.error("Training Failed! Make sure images are in media/data folder.", {
                icon: '❌'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStopTraining = () => {
        // Implement stop training logic
        setLoading(false);
        setTrainingProgress(0);
        toast('Training stopped', { icon: '⏸️' });
    };

    const handleExportModel = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/model/export/', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'face_recognition_model.xml');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Model exported successfully');
        } catch (err) {
            toast.error('Failed to export model');
        }
    };

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        }]);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Brain className="text-gray-900" />
                        Train Face Recognition Model
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Train and optimize machine learning models for face recognition
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDatasetStats}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                    >
                        <RefreshCw size={16} />
                        Refresh Stats
                    </button>
                    {modelInfo && (
                        <button
                            onClick={handleExportModel}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Export Model
                        </button>
                    )}
                </div>
            </div>

            {/* Dataset Statistics Cards */}
            {datasetStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Users size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Persons</p>
                                <p className="text-xl font-semibold text-gray-900">{datasetStats.totalPersons}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Camera size={18} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Images</p>
                                <p className="text-xl font-semibold text-gray-900">{datasetStats.totalImages}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Database size={18} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Avg Images/Person</p>
                                <p className="text-xl font-semibold text-gray-900">{datasetStats.avgImagesPerPerson}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Clock size={18} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Last Updated</p>
                                <p className="text-sm font-semibold text-gray-900">{datasetStats.lastUpdated}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Training Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Training Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900">Training Configuration</h3>
                        </div>

                        <div className="p-6">
                            {/* Algorithm Selection */}
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-gray-500 mb-3">Select Algorithm</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {algorithms.map(algo => (
                                        <button
                                            key={algo.id}
                                            onClick={() => setSelectedAlgorithm(algo.id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${selectedAlgorithm === algo.id
                                                    ? 'border-gray-900 bg-gray-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-gray-900">{algo.name}</span>
                                                {selectedAlgorithm === algo.id && (
                                                    <CheckCircle size={16} className="text-gray-900" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">{algo.description}</p>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="text-green-600">Accuracy: {algo.accuracy}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-blue-600">Speed: {algo.speed}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hyperparameters */}
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
                                >
                                    <Settings size={16} />
                                    Advanced Hyperparameters
                                    <ChevronDown size={16} className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Radius</label>
                                                    <input
                                                        type="number"
                                                        value={hyperparameters.radius}
                                                        onChange={e => setHyperparameters({ ...hyperparameters, radius: parseFloat(e.target.value) })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        min="1"
                                                        max="5"
                                                        step="0.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Neighbors</label>
                                                    <input
                                                        type="number"
                                                        value={hyperparameters.neighbors}
                                                        onChange={e => setHyperparameters({ ...hyperparameters, neighbors: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        min="4"
                                                        max="16"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Grid X</label>
                                                    <input
                                                        type="number"
                                                        value={hyperparameters.gridX}
                                                        onChange={e => setHyperparameters({ ...hyperparameters, gridX: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        min="4"
                                                        max="16"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Grid Y</label>
                                                    <input
                                                        type="number"
                                                        value={hyperparameters.gridY}
                                                        onChange={e => setHyperparameters({ ...hyperparameters, gridY: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        min="4"
                                                        max="16"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Confidence Threshold</label>
                                                    <input
                                                        type="number"
                                                        value={hyperparameters.confidenceThreshold}
                                                        onChange={e => setHyperparameters({ ...hyperparameters, confidenceThreshold: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        min="50"
                                                        max="95"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Test Split (%)</label>
                                                    <input
                                                        type="number"
                                                        value={hyperparameters.testSplit * 100}
                                                        onChange={e => setHyperparameters({ ...hyperparameters, testSplit: parseFloat(e.target.value) / 100 })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        min="10"
                                                        max="40"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Training Progress */}
                            {loading && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500">Training Progress</span>
                                        <span className="text-xs font-medium text-gray-900">{trainingProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${trainingProgress}%` }}
                                            className="h-full bg-gray-900"
                                        />
                                    </div>
                                    {estimatedTime && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Estimated time remaining: {estimatedTime}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleTrain}
                                    disabled={loading}
                                    className="flex-1 px-6 py-4 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Training in Progress...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={18} />
                                            Start Training
                                        </>
                                    )}
                                </button>

                                {loading && (
                                    <button
                                        onClick={handleStopTraining}
                                        className="px-6 py-4 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <StopCircle size={18} />
                                        Stop
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Training Logs */}
                    {logs.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">Training Logs</h3>
                            </div>
                            <div className="p-4 max-h-48 overflow-y-auto">
                                <div className="space-y-2">
                                    {logs.map((log, index) => (
                                        <div key={index} className="flex items-start gap-2 text-xs">
                                            <span className="text-gray-400 min-w-[70px]">{log.timestamp}</span>
                                            <span className={`${log.type === 'error' ? 'text-red-600' :
                                                    log.type === 'success' ? 'text-green-600' :
                                                        'text-gray-600'
                                                }`}>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Model Info & Statistics */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Current Model Info */}
                    {modelInfo && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">Current Model</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Algorithm</p>
                                        <p className="text-sm font-medium text-gray-900">{modelInfo.algorithm}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Training Date</p>
                                        <p className="text-sm font-medium text-gray-900">{modelInfo.trainingDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Training Duration</p>
                                        <p className="text-sm font-medium text-gray-900">{modelInfo.duration}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Model Size</p>
                                        <p className="text-sm font-medium text-gray-900">{modelInfo.size}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Accuracy</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">{modelInfo.accuracy}%</span>
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gray-900"
                                                    style={{ width: `${modelInfo.accuracy}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Validation Results */}
                    {validationResults && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">Validation Results</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Overall Accuracy</p>
                                        <p className="text-2xl font-bold text-gray-900">{validationResults.accuracy}%</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Precision</p>
                                            <p className="text-lg font-semibold text-gray-900">{validationResults.precision}%</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Recall</p>
                                            <p className="text-lg font-semibold text-gray-900">{validationResults.recall}%</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">F1 Score</p>
                                            <p className="text-lg font-semibold text-gray-900">{validationResults.f1Score}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Test Samples</p>
                                            <p className="text-lg font-semibold text-gray-900">{validationResults.testSamples}</p>
                                        </div>
                                    </div>

                                    {/* Confusion Matrix Preview */}
                                    {validationResults.confusionMatrix && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-2">Confusion Matrix</p>
                                            <div className="grid grid-cols-2 gap-1 text-center text-xs">
                                                <div className="p-2 bg-gray-50 rounded-l-lg">
                                                    <span className="text-gray-500">True Pos: </span>
                                                    <span className="font-medium text-gray-900">{validationResults.confusionMatrix.truePos}</span>
                                                </div>
                                                <div className="p-2 bg-gray-50 rounded-r-lg">
                                                    <span className="text-gray-500">False Pos: </span>
                                                    <span className="font-medium text-gray-900">{validationResults.confusionMatrix.falsePos}</span>
                                                </div>
                                                <div className="p-2 bg-gray-50 rounded-l-lg">
                                                    <span className="text-gray-500">False Neg: </span>
                                                    <span className="font-medium text-gray-900">{validationResults.confusionMatrix.falseNeg}</span>
                                                </div>
                                                <div className="p-2 bg-gray-50 rounded-r-lg">
                                                    <span className="text-gray-500">True Neg: </span>
                                                    <span className="font-medium text-gray-900">{validationResults.confusionMatrix.trueNeg}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Training History */}
                    {trainingHistory.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">Training History</h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    {trainingHistory.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">{item.date}</p>
                                                <p className="text-xs text-gray-500">{item.algorithm}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-gray-900">{item.accuracy}%</p>
                                                <p className="text-xs text-gray-500">{item.duration}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dataset Requirements & Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Info size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Dataset Requirements & Tips</h3>
                        <ul className="space-y-2 text-sm text-blue-700">
                            <li className="flex items-start gap-2">
                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>Place student images in <code className="bg-blue-100 px-1 py-0.5 rounded">media/data/student_name/</code> folder</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>Minimum 20-30 images per student for good accuracy</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>Use different angles, expressions, and lighting conditions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>Supported formats: JPG, PNG, JPEG</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>Training time depends on dataset size and selected algorithm</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainPage;