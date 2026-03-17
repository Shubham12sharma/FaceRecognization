import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Download, Search, Filter, Calendar, ChevronDown,
    Eye, Printer, RefreshCw, CheckCircle, XCircle,
    Clock, UserCheck, FileText, MoreHorizontal, Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AttendancePage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDept, setFilterDept] = useState('All');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [departments, setDepartments] = useState(['All']);
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalRecords: 0
    });

    const statuses = ['All', 'Present', 'Absent', 'Late'];

    useEffect(() => {
        fetchAttendanceRecords();
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (filterStatus !== 'All' || filterDept !== 'All' || searchTerm || selectedDate) {
            fetchAttendanceRecords();
        }
    }, [filterStatus, filterDept, searchTerm, selectedDate]);

    const fetchAttendanceRecords = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.error('Please login again');
                window.location.href = '/login';
                return;
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (filterStatus !== 'All') params.append('status', filterStatus.toLowerCase());
            if (filterDept !== 'All') params.append('department', filterDept);
            if (searchTerm) params.append('search', searchTerm);
            if (selectedDate) params.append('date', selectedDate);
            params.append('page', page);

            const response = await axios.get(`http://127.0.0.1:8000/api/attendance/?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setRecords(response.data.results || response.data);

            // Update pagination if available
            if (response.data.count) {
                setPagination({
                    page: page,
                    totalPages: Math.ceil(response.data.count / 20),
                    totalRecords: response.data.count
                });
            }

            // Calculate statistics
            calculateStats(response.data.results || response.data);

        } catch (error) {
            console.error('Error fetching attendance:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
            } else {
                toast.error('Failed to load attendance records');
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await axios.get('http://127.0.0.1:8000/api/departments/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const deptNames = ['All', ...response.data.map(d => d.name)];
            setDepartments(deptNames);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const present = data.filter(r => r.status === 'present').length;
        const absent = data.filter(r => r.status === 'absent').length;
        const late = data.filter(r => r.status === 'late').length;
        const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

        setStats({
            total,
            present,
            absent,
            late,
            attendanceRate
        });
    };

    const exportPDF = () => {
        if (records.length === 0) {
            toast.error('No records to export');
            return;
        }

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: 'a4'
        });

        // Add header
        doc.setFillColor(17, 24, 39);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Face Recognition Attendance Report', 20, 30);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
        doc.text(`Date: ${selectedDate}`, 20, 45);

        // Add summary
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Total Students: ${stats.total}`, 20, 70);
        doc.text(`Present: ${stats.present}`, 20, 85);
        doc.text(`Absent: ${stats.absent}`, 20, 100);
        doc.text(`Late: ${stats.late}`, 20, 115);
        doc.text(`Attendance Rate: ${stats.attendanceRate}%`, 20, 130);

        // Add table
        doc.autoTable({
            startY: 150,
            head: [['ID', 'Name', 'Department', 'Roll No', 'Date', 'Time', 'Status', 'Confidence']],
            body: records.map(r => [
                r.student?.student_id || r.id,
                r.student?.name || r.student_name || '-',
                r.student?.department_name || r.department || '-',
                r.student?.roll_no || r.roll || '-',
                r.date,
                r.time,
                r.status,
                r.confidence > 0 ? `${r.confidence}%` : '-'
            ]),
            headStyles: {
                fillColor: [17, 24, 39],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 150 }
        });

        doc.save(`Attendance_Report_${selectedDate.replace(/-/g, '_')}.pdf`);
        toast.success('PDF exported successfully');
    };

    const exportCSV = async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await axios.get('http://127.0.0.1:8000/api/attendance/export/', {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${selectedDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('CSV exported successfully');
        } catch (error) {
            toast.error('Failed to export CSV');
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(records.map(r => r.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectRecord = (id) => {
        if (selectedRecords.includes(id)) {
            setSelectedRecords(selectedRecords.filter(recordId => recordId !== id));
            setSelectAll(false);
        } else {
            setSelectedRecords([...selectedRecords, id]);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchAttendanceRecords(pagination.page);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchAttendanceRecords(newPage);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedRecords.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedRecords.length} record(s)?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            await Promise.all(selectedRecords.map(id =>
                axios.delete(`http://127.0.0.1:8000/api/attendance/${id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ));

            toast.success(`${selectedRecords.length} records deleted successfully`);
            setSelectedRecords([]);
            setSelectAll(false);
            fetchAttendanceRecords(pagination.page);
        } catch (error) {
            toast.error('Failed to delete some records');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            present: 'bg-green-50 text-green-700 border-green-200',
            absent: 'bg-red-50 text-red-700 border-red-200',
            late: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        };
        return styles[status] || styles.present;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle size={14} className="text-green-600" />;
            case 'absent': return <XCircle size={14} className="text-red-600" />;
            case 'late': return <Clock size={14} className="text-yellow-600" />;
            default: return null;
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-GB', options);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (loading && records.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading attendance records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage and track student attendance with face recognition
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                    <div className="relative group">
                        <button
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
                            <button
                                onClick={exportPDF}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                            >
                                Export as PDF
                            </button>
                            <button
                                onClick={exportCSV}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg"
                            >
                                Export as CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Records', value: stats.total, icon: UserCheck, color: 'text-gray-900', bg: 'bg-gray-100' },
                    { label: 'Present', value: stats.present, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Absent', value: stats.absent, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Late', value: stats.late, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl border border-gray-200 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <Icon size={18} className={stat.color} />
                                </div>
                                <span className="text-2xl font-semibold text-gray-900">{stat.value}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, roll number or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative min-w-[140px]">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                        >
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>

                    {/* Department Filter */}
                    <div className="relative min-w-[180px]">
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="appearance-none w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>

                    {/* Date Picker */}
                    <div className="relative min-w-[150px]">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                        />
                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => fetchAttendanceRecords(1)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                    >
                        <Filter size={16} />
                        Apply Filters
                    </button>
                </div>

                {/* Active Filters */}
                {(filterStatus !== 'All' || filterDept !== 'All' || searchTerm || selectedDate) && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Active filters:</span>
                        {filterStatus !== 'All' && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                Status: {filterStatus}
                            </span>
                        )}
                        {filterDept !== 'All' && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                Dept: {filterDept}
                            </span>
                        )}
                        {searchTerm && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                Search: {searchTerm}
                            </span>
                        )}
                        {selectedDate && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                Date: {selectedDate}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('All');
                                setFilterDept('All');
                                setSelectedDate(new Date().toISOString().split('T')[0]);
                                fetchAttendanceRecords(1);
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Table Header with Selection Info */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                                <span className="text-sm font-medium text-gray-700">Select All</span>
                            </label>
                            {selectedRecords.length > 0 && (
                                <span className="text-sm text-gray-600">
                                    {selectedRecords.length} record(s) selected
                                </span>
                            )}
                        </div>
                        {selectedRecords.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Delete Selected
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select</span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Student</span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Roll No</span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Department</span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {records.map((record, index) => (
                                    <motion.tr
                                        key={record.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecords.includes(record.id)}
                                                onChange={() => handleSelectRecord(record.id)}
                                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                    {record.student?.photo ? (
                                                        <img src={record.student.photo} alt={record.student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-medium text-gray-600">
                                                            {record.student?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {record.student?.name || record.student_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{record.student?.student_id || record.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{record.student?.roll_no || record.roll || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {record.student?.department_name || record.department || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{formatDate(record.date)}</p>
                                            <p className="text-xs text-gray-500">{formatTime(record.time)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(record.status)}
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(record.status)}`}>
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.confidence > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-900">{record.confidence}%</span>
                                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${record.confidence >= 95 ? 'bg-green-500' :
                                                                    record.confidence >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${record.confidence}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                                    onClick={() => {/* View details */ }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {records.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">No records found</h3>
                        <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
                    </div>
                )}

                {/* Table Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Showing {records.length} of {pagination.totalRecords} records
                        </p>
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${pagination.page === pageNum
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                                    <>
                                        <span className="text-xs text-gray-500">...</span>
                                        <button
                                            onClick={() => handlePageChange(pagination.totalPages)}
                                            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            {pagination.totalPages}
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;