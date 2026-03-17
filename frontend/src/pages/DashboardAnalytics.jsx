import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Users, Camera, Award, TrendingUp, Calendar,
    ChevronRight, Download, MoreVertical, Loader
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
    CartesianGrid
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-600">
                    Present: {' '}
                    <span className="font-medium text-gray-900">
                        {payload[0]?.value}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

const DashboardAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_students: 0,
        present_today: 0,
        absent_today: 0,
        late_today: 0,
        recognition_accuracy: 0,
        model_accuracy: 0,
        total_images: 0,
        attendance_rate: 0
    });

    const [weeklyData, setWeeklyData] = useState([]);
    const [deptData, setDeptData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [dateRange, setDateRange] = useState('last7days');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.error('Please login again');
                window.location.href = '/login';
                return;
            }

            // Set auth header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Fetch all dashboard data in parallel
            const [statsRes, weeklyRes, deptRes, activityRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/dashboard/stats/'),
                axios.get('http://127.0.0.1:8000/api/dashboard/weekly-attendance/'),
                axios.get('http://127.0.0.1:8000/api/dashboard/department-distribution/'),
                axios.get('http://127.0.0.1:8000/api/dashboard/recent-activity/')
            ]);

            setStats(statsRes.data);
            setWeeklyData(weeklyRes.data);
            setDeptData(deptRes.data);
            setRecentActivity(activityRes.data);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
            } else {
                toast.error('Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await axios.get('http://127.0.0.1:8000/api/attendance/export/', {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Report exported successfully');
        } catch (error) {
            toast.error('Failed to export report');
        }
    };

    const handleDateRangeChange = async (range) => {
        setDateRange(range);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await axios.get(`http://127.0.0.1:8000/api/dashboard/weekly-attendance/?range=${range}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setWeeklyData(response.data);
        } catch (error) {
            toast.error('Failed to update date range');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    // Prepare data for charts
    const chartAttendanceData = weeklyData.length > 0 ? weeklyData.map(item => ({
        day: item.day,
        present: item.present,
        absent: item.absent,
        late: item.late
    })) : [
        { day: 'Mon', present: 0, absent: 0, late: 0 },
        { day: 'Tue', present: 0, absent: 0, late: 0 },
        { day: 'Wed', present: 0, absent: 0, late: 0 },
        { day: 'Thu', present: 0, absent: 0, late: 0 },
        { day: 'Fri', present: 0, absent: 0, late: 0 },
    ];

    const chartDeptData = deptData.length > 0 ? deptData.map((dept, index) => ({
        name: dept.name,
        value: dept.value,
        students: dept.students,
        color: getDepartmentColor(index)
    })) : [];

    function getDepartmentColor(index) {
        const colors = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];
        return colors[index % colors.length];
    }

    return (
        <div className="space-y-8">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900">Dashboard Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Last updated: {new Date().toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => handleDateRangeChange(e.target.value)}
                        className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                    >
                        <option value="last7days">Last 7 days</option>
                        <option value="last30days">Last 30 days</option>
                        <option value="thismonth">This month</option>
                        <option value="lastmonth">Last month</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button
                        onClick={fetchDashboardData}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    {
                        icon: Users,
                        label: "Total Students",
                        value: stats.total_students,
                        change: `${stats.total_images} images in dataset`,
                        iconBg: "bg-blue-50",
                        iconColor: "text-blue-600"
                    },
                    {
                        icon: Camera,
                        label: "Present Today",
                        value: stats.present_today,
                        change: `${stats.late_today} late, ${stats.absent_today} absent`,
                        iconBg: "bg-green-50",
                        iconColor: "text-green-600"
                    },
                    {
                        icon: Award,
                        label: "Model Accuracy",
                        value: `${stats.model_accuracy}%`,
                        change: `Recognition: ${stats.recognition_accuracy}%`,
                        iconBg: "bg-purple-50",
                        iconColor: "text-purple-600"
                    },
                    {
                        icon: TrendingUp,
                        label: "Attendance Rate",
                        value: `${stats.attendance_rate}%`,
                        change: "Last 30 days",
                        iconBg: "bg-orange-50",
                        iconColor: "text-orange-600"
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-semibold text-gray-900">{stat.value}</h3>
                            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Weekly Attendance Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Weekly Attendance</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {weeklyData.length > 0 ? `${weeklyData[0]?.date} to ${weeklyData[weeklyData.length - 1]?.date}` : 'No data available'}
                            </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                        </button>
                    </div>
                    {weeklyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={chartAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="present" fill="#111827" radius={[4, 4, 0, 0]} barSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-400">
                            No attendance data available
                        </div>
                    )}
                </div>

                {/* Department Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">By Department</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Student distribution</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    {chartDeptData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={chartDeptData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {chartDeptData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-6 space-y-2">
                                {chartDeptData.map((dept, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }}></span>
                                            <span className="text-gray-600">{dept.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-900 font-medium">{dept.students}</span>
                                            <span className="text-gray-400 text-xs">{dept.value}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-gray-400">
                            No department data available
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Recent Recognition</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Live face detection feed</p>
                        </div>
                        <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                            View all
                        </button>
                    </div>
                </div>
                {recentActivity.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {recentActivity.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-600">
                                                            {activity.student_name?.split(' ').map(n => n[0]).join('') || '?'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {activity.student_name || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(activity.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${activity.recognized
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {activity.recognized ? 'Recognized' : 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-900">{activity.confidence}%</span>
                                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${activity.confidence >= 90 ? 'bg-green-500' :
                                                                    activity.confidence >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${activity.confidence}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <ChevronRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last updated: just now</span>
                                <span>Showing {recentActivity.length} of {stats.total_recognitions || recentActivity.length} entries</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center text-gray-400">
                        <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No recent recognition activity</p>
                        <p className="text-sm mt-1">Start face recognition to see activity here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardAnalytics;