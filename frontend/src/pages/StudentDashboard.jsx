import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    User, Calendar, Clock, CheckCircle, XCircle,
    TrendingUp, Award, Camera, BookOpen, LogOut,
    Bell, Settings, ChevronRight, Activity, Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        attendancePercentage: 0
    });

    useEffect(() => {
        fetchStudentDashboard();
    }, []);

    const fetchStudentDashboard = async () => {
        try {
            const token = localStorage.getItem('access_token');
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const response = await axios.get('http://127.0.0.1:8000/api/student/dashboard/');

            setStudentData(response.data.student);
            setAttendanceData(response.data.recent_attendance);
            setRecentLogs(response.data.recent_logs);
            setSchedule(response.data.upcoming_schedule);
            setStats(response.data.attendance_summary);
        } catch (error) {
            console.error('Error fetching student dashboard:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        toast.success('Logged out successfully');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">
                                Student Dashboard
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                                <Bell size={20} className="text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <Settings size={20} className="text-gray-600" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 p-6 mb-8"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-600">
                                {studentData?.name?.split(' ').map(n => n[0]).join('')}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Welcome back, {studentData?.name}!
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Student ID: {studentData?.student_id} | Roll No: {studentData?.roll_no}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    {studentData?.department_name}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    Year {studentData?.year}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    Semester {studentData?.semester}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Today's Date</p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl border border-gray-200 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Days</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDays}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl border border-gray-200 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Present Days</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.presentDays}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl border border-gray-200 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Absent Days</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.absentDays}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-xl border border-gray-200 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Attendance Rate</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.attendancePercentage}%</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Percent className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Attendance & Schedule */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Attendance */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-xl border border-gray-200"
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Attendance</h3>
                        </div>
                        <div className="p-6">
                            {attendanceData.length > 0 ? (
                                <div className="space-y-4">
                                    {attendanceData.map((record, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${record.status === 'present' ? 'bg-green-100' :
                                                        record.status === 'late' ? 'bg-yellow-100' : 'bg-red-100'
                                                    }`}>
                                                    {record.status === 'present' ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : record.status === 'late' ? (
                                                        <Clock className="w-4 h-4 text-yellow-600" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {new Date(record.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{record.time}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {record.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No attendance records found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Upcoming Schedule */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-xl border border-gray-200"
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Upcoming Schedule</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {schedule.map((day, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{day.date}</p>
                                            <p className="text-xs text-gray-500">{day.day}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${day.status === 'Regular' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {day.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Recognition Logs */}
                {recentLogs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mt-6 bg-white rounded-xl border border-gray-200"
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Face Recognition Logs</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {recentLogs.map((log, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-900">{log.confidence}%</span>
                                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                                                        <div
                                                            className={`h-full rounded-full ${log.confidence >= 90 ? 'bg-green-500' :
                                                                    log.confidence >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${log.confidence}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${log.recognized
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {log.recognized ? 'Recognized' : 'Unknown'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;