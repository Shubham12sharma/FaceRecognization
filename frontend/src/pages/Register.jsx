import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    UserPlus, Mail, Lock, Eye, EyeOff,
    User, Phone, Calendar, MapPin, BookOpen,
    Users, Camera, AlertCircle, ChevronRight,
    GraduationCap, Hash, Award
} from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        // Account Info
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        role: 'student',

        // Personal Info
        first_name: '',
        last_name: '',
        mobile: '',
        gender: '',
        date_of_birth: '',

        // Academic Info
        student_id: '',
        roll_no: '',
        department: '',
        year: '1',
        semester: '1',
        division: 'A',
        address: ''
    });

    const departments = [
        'Computer Science',
        'Information Technology',
        'Electronics',
        'Mechanical',
        'Civil',
        'Electrical'
    ];

    const years = ['1', '2', '3', '4'];
    const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const genders = ['Male', 'Female', 'Other'];
    const divisions = ['A', 'B', 'C'];

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

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your password';
        } else if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.mobile.trim()) {
            newErrors.mobile = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = 'Invalid mobile number';
        }

        if (!formData.gender) {
            newErrors.gender = 'Please select gender';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};

        if (!formData.student_id.trim()) {
            newErrors.student_id = 'Student ID is required';
        }

        if (!formData.roll_no.trim()) {
            newErrors.roll_no = 'Roll number is required';
        }

        if (!formData.department) {
            newErrors.department = 'Please select department';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handlePrevious = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep3()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/register/',
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
                localStorage.setItem('access_token', access);
                localStorage.setItem('refresh_token', refresh);
                localStorage.setItem('user', JSON.stringify(user));

                // Set axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

                toast.success('Registration successful!');

                // Redirect based on role
                if (user.role === 'student') {
                    navigate('/student-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                toast.error(response.data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (error.response) {
                toast.error(error.response.data.error || 'Registration failed');
            } else if (error.request) {
                toast.error('Cannot connect to server. Please check if backend is running.');
            } else {
                toast.error('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full relative z-10"
            >
                {/* Header */}
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
                        Create Account
                    </h1>
                    <p className="text-gray-500 mt-2">Join FaceRecog Attendance System</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s <= step ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-16 h-1 mx-2 ${s < step ? 'bg-gray-900' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Account</span>
                        <span>Personal</span>
                        <span>Academic</span>
                    </div>
                </div>

                {/* Registration Form */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
                >
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Account Information */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all`}
                                            placeholder="Choose a username"
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
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all`}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
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
                                            placeholder="Create a password"
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirm_password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-12 py-3 border ${errors.confirm_password ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all`}
                                            placeholder="Confirm your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirm_password && (
                                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.confirm_password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    >
                                        <option value="student">Student</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal Information */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border ${errors.first_name ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900`}
                                            placeholder="First name"
                                        />
                                        {errors.first_name && (
                                            <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border ${errors.last_name ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900`}
                                            placeholder="Last name"
                                        />
                                        {errors.last_name && (
                                            <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mobile Number *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 border ${errors.mobile ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900`}
                                            placeholder="10 digit mobile number"
                                        />
                                    </div>
                                    {errors.mobile && (
                                        <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gender *
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border ${errors.gender ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900`}
                                        >
                                            <option value="">Select Gender</option>
                                            {genders.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                        {errors.gender && (
                                            <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="date"
                                                name="date_of_birth"
                                                value={formData.date_of_birth}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Academic Information */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Information</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Student ID *
                                        </label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                name="student_id"
                                                value={formData.student_id}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-4 py-3 border ${errors.student_id ? 'border-red-500' : 'border-gray-200'
                                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900`}
                                                placeholder="e.g., CS2021001"
                                            />
                                        </div>
                                        {errors.student_id && (
                                            <p className="mt-1 text-xs text-red-500">{errors.student_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Roll Number *
                                        </label>
                                        <div className="relative">
                                            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                name="roll_no"
                                                value={formData.roll_no}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-4 py-3 border ${errors.roll_no ? 'border-red-500' : 'border-gray-200'
                                                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900`}
                                                placeholder="e.g., 2021001"
                                            />
                                        </div>
                                        {errors.roll_no && (
                                            <p className="mt-1 text-xs text-red-500">{errors.roll_no}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Department *
                                    </label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className={`w-full pl-10 pr-4 py-3 border ${errors.department ? 'border-red-500' : 'border-gray-200'
                                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900`}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.department && (
                                        <p className="mt-1 text-xs text-red-500">{errors.department}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Year
                                        </label>
                                        <select
                                            name="year"
                                            value={formData.year}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        >
                                            {years.map(y => (
                                                <option key={y} value={y}>Year {y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Semester
                                        </label>
                                        <select
                                            name="semester"
                                            value={formData.semester}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        >
                                            {semesters.map(s => (
                                                <option key={s} value={s}>Sem {s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Division
                                        </label>
                                        <select
                                            name="division"
                                            value={formData.division}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        >
                                            {divisions.map(d => (
                                                <option key={d} value={d}>Div {d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows="3"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                                            placeholder="Enter your address"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Previous
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="ml-auto px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-auto px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Create Account
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-gray-900 font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Register;