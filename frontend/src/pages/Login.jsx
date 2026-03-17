import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    LogIn, Mail, Lock, Eye, EyeOff,
    Shield, Users, Camera, Award, AlertCircle
} from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('access_token');
        if (token) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'student') {
                navigate('/student-dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: null
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/login/',
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                const { access, refresh, user } = response.data;

                // Store tokens
                if (rememberMe) {
                    localStorage.setItem('access_token', access);
                    localStorage.setItem('refresh_token', refresh);
                } else {
                    sessionStorage.setItem('access_token', access);
                    sessionStorage.setItem('refresh_token', refresh);
                }

                localStorage.setItem('user', JSON.stringify(user));

                // Set axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

                toast.success(`Welcome back, ${user.first_name || user.username}!`);

                // Redirect based on role
                if (user.role === 'student') {
                    navigate('/student-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                toast.error(response.data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response) {
                // Server responded with error
                toast.error(error.response.data.error || 'Invalid username or password');
            } else if (error.request) {
                // Request made but no response
                toast.error('Cannot connect to server. Please check if backend is running.');
            } else {
                // Something else happened
                toast.error('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Demo login function
    const handleDemoLogin = (role) => {
        if (role === 'admin') {
            setFormData({
                username: 'admin',
                password: 'admin123'
            });
        } else {
            setFormData({
                username: 'student',
                password: 'student123'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full relative z-10"
            >
                {/* Logo and Brand */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-2xl mb-4 shadow-xl"
                    >
                        <Camera className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-gray-900">
                        Face<span className="text-gray-600">Recog</span>
                    </h1>
                    <p className="text-gray-500 mt-2">Advanced Face Recognition Attendance System</p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { icon: Shield, label: 'Secure', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Users, label: 'Multi-user', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { icon: Award, label: '99.9% Accuracy', color: 'text-green-600', bg: 'bg-green-50' }
                    ].map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className={`${feature.bg} rounded-xl p-3 text-center shadow-sm border border-gray-100`}
                            >
                                <Icon className={`w-5 h-5 mx-auto mb-1 ${feature.color}`} />
                                <p className="text-xs text-gray-600">{feature.label}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-200'
                                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all`}
                                    placeholder="Enter your username"
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-200'
                                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <button
                                type="button"
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-gray-900 font-medium hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Demo Buttons */}
                    <div className="mt-6 space-y-2">
                        <p className="text-xs text-gray-500 text-center">Demo Login</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleDemoLogin('admin')}
                                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Login as Admin
                            </button>
                            <button
                                onClick={() => handleDemoLogin('student')}
                                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Login as Student
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-8">
                    © 2024 FaceRecog. All rights reserved.
                </p>
            </motion.div>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
};

export default Login;