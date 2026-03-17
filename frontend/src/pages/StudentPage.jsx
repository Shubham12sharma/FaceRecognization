import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, Search, Filter, Edit2, Trash2,
    Eye, Download, Upload, RefreshCw, ChevronDown,
    Mail, Phone, Calendar, MapPin, BookOpen,
    GraduationCap, Users, X, Check, AlertCircle,
    MoreVertical, FileText, Camera, Loader
} from 'lucide-react';

const StudentPage = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [filterYear, setFilterYear] = useState('All');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [importModal, setImportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [departments, setDepartments] = useState(['All']);
    const [courses, setCourses] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalRecords: 0
    });

    const [form, setForm] = useState({
        student_id: '',
        name: '',
        department: '',
        course: '',
        year: '',
        semester: '',
        division: '',
        roll_no: '',
        gender: '',
        date_of_birth: '',
        email: '',
        mobile: '',
        address: '',
        blood_group: '',
        emergency_contact: '',
        photo: null
    });

    const years = ['1', '2', '3', '4'];
    const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const genders = ['Male', 'Female', 'Other'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const divisions = ['A', 'B', 'C'];

    useEffect(() => {
        fetchStudents();
        fetchDepartments();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [searchTerm, filterDept, filterYear, students]);

    useEffect(() => {
        if (selectAll) {
            setSelectedStudents(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    }, [selectAll, filteredStudents]);

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                toast.error('Please login again');
                window.location.href = '/login';
                return;
            }

            const params = new URLSearchParams();
            params.append('page', page);
            if (searchTerm) params.append('search', searchTerm);
            if (filterDept !== 'All') params.append('department', filterDept);
            if (filterYear !== 'All') params.append('year', filterYear);

            const response = await axios.get(`http://127.0.0.1:8000/api/students/?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = response.data.results || response.data;
            setStudents(data);
            setFilteredStudents(data);

            if (response.data.count) {
                setPagination({
                    page: page,
                    totalPages: Math.ceil(response.data.count / 20),
                    totalRecords: response.data.count
                });
            }

        } catch (error) {
            console.error('Error fetching students:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
            } else {
                toast.error('Failed to load students');
            }
        } finally {
            setLoading(false);
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

    const fetchCourses = async (departmentId) => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const response = await axios.get(`http://127.0.0.1:8000/api/courses/?department=${departmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const filterStudents = () => {
        let filtered = [...students];

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterDept !== 'All') {
            filtered = filtered.filter(s => s.department_name === filterDept);
        }

        if (filterYear !== 'All') {
            filtered = filtered.filter(s => s.year === filterYear);
        }

        setFilteredStudents(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!form.student_id || !form.name || !form.email || !form.mobile) {
            toast.error('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const formData = new FormData();

            // Append all form fields
            Object.keys(form).forEach(key => {
                if (form[key] !== null && form[key] !== '') {
                    formData.append(key, form[key]);
                }
            });

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (editingStudent) {
                await axios.put(`http://127.0.0.1:8000/api/students/${editingStudent.id}/`, formData, config);
                toast.success("Student Updated Successfully!");
            } else {
                await axios.post('http://127.0.0.1:8000/api/students/', formData, config);
                toast.success("Student Added Successfully!");
            }

            resetForm();
            fetchStudents(pagination.page);
            setShowForm(false);
            setEditingStudent(null);
        } catch (error) {
            console.error('Error saving student:', error);
            toast.error(error.response?.data?.message || (editingStudent ? "Failed to update student" : "Failed to add student"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (studentId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            await axios.delete(`http://127.0.0.1:8000/api/students/${studentId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Student Deleted Successfully!");
            fetchStudents(pagination.page);
            setShowDeleteConfirm(false);
            setStudentToDelete(null);
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error("Failed to delete student");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedStudents.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            await Promise.all(selectedStudents.map(id =>
                axios.delete(`http://127.0.0.1:8000/api/students/${id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ));
            toast.success(`${selectedStudents.length} students deleted successfully!`);
            setSelectedStudents([]);
            setSelectAll(false);
            fetchStudents(pagination.page);
        } catch (error) {
            console.error('Error bulk deleting students:', error);
            toast.error("Failed to delete some students");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setForm({
            student_id: student.student_id || '',
            name: student.name || '',
            department: student.department || '',
            course: student.course || '',
            year: student.year || '',
            semester: student.semester || '',
            division: student.division || '',
            roll_no: student.roll_no || '',
            gender: student.gender || '',
            date_of_birth: student.date_of_birth || '',
            email: student.email || '',
            mobile: student.mobile || '',
            address: student.address || '',
            blood_group: student.blood_group || '',
            emergency_contact: student.emergency_contact || '',
            photo: null
        });
        if (student.department) {
            fetchCourses(student.department);
        }
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({
            student_id: '', name: '', department: '', course: '', year: '',
            semester: '', division: '', roll_no: '', gender: '', date_of_birth: '',
            email: '', mobile: '', address: '', blood_group: '',
            emergency_contact: '', photo: null
        });
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            let data = selectedStudents.length > 0
                ? students.filter(s => selectedStudents.includes(s.id))
                : students;

            if (exportFormat === 'csv') {
                const headers = ['ID', 'Student ID', 'Name', 'Department', 'Course', 'Year', 'Semester',
                    'Roll No', 'Email', 'Mobile', 'Gender', 'Date of Birth', 'Blood Group', 'Address'];

                const csv = [
                    headers.join(','),
                    ...data.map(s => [
                        s.id,
                        s.student_id,
                        `"${s.name}"`,
                        s.department_name || '',
                        s.course_name || '',
                        s.year || '',
                        s.semester || '',
                        s.roll_no || '',
                        s.email || '',
                        s.mobile || '',
                        s.gender || '',
                        s.date_of_birth || '',
                        s.blood_group || '',
                        `"${s.address || ''}"`
                    ].join(','))
                ].join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `students_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
            }

            toast.success(`Exported ${data.length} students`);
        } catch (error) {
            console.error('Error exporting students:', error);
            toast.error('Failed to export students');
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            await axios.post('http://127.0.0.1:8000/api/students/import/', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Students imported successfully');
            fetchStudents(1);
            setImportModal(false);
        } catch (error) {
            console.error('Error importing students:', error);
            toast.error('Failed to import students');
        }
    };

    const getStudentStats = () => {
        const total = students.length;
        // These would come from attendance API in real implementation
        const present = 0;
        const absent = 0;
        const late = 0;

        return { total, present, absent, late };
    };

    const stats = getStudentStats();

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchStudents(newPage);
        }
    };

    if (loading && students.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="text-gray-900" />
                        Student Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage student profiles, enrollments, and attendance records
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingStudent(null);
                            setShowForm(true);
                        }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Add New Student
                    </button>
                    <button
                        onClick={() => setImportModal(true)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                    >
                        <Upload size={16} />
                        Import
                    </button>
                    <div className="relative group">
                        <button
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
                            <button
                                onClick={() => {
                                    setExportFormat('csv');
                                    handleExport();
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                            >
                                Export as CSV
                            </button>
                            <button
                                onClick={() => {
                                    setExportFormat('json');
                                    handleExport();
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg"
                            >
                                Export as JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Users size={18} className="text-gray-700" />
                        </div>
                        <span className="text-2xl font-semibold text-gray-900">{stats.total}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Total Students</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Check size={18} className="text-green-600" />
                        </div>
                        <span className="text-2xl font-semibold text-gray-900">{stats.present}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Present Today</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <X size={18} className="text-red-600" />
                        </div>
                        <span className="text-2xl font-semibold text-gray-900">{stats.absent}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Absent Today</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <AlertCircle size={18} className="text-yellow-600" />
                        </div>
                        <span className="text-2xl font-semibold text-gray-900">{stats.late}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Late Today</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID, roll number or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
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

                    {/* Year Filter */}
                    <div className="relative min-w-[120px]">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="appearance-none w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                        >
                            <option value="All">All Years</option>
                            {years.map(year => (
                                <option key={year} value={year}>Year {year}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-2 text-sm ${viewMode === 'table'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 text-sm ${viewMode === 'grid'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Grid
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => fetchStudents(pagination.page)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Active Filters */}
                {(searchTerm || filterDept !== 'All' || filterYear !== 'All') && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Active filters:</span>
                        {searchTerm && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                Search: {searchTerm}
                            </span>
                        )}
                        {filterDept !== 'All' && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                Dept: {filterDept}
                            </span>
                        )}
                        {filterYear !== 'All' && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                Year: {filterYear}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterDept('All');
                                setFilterYear('All');
                                fetchStudents(1);
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        <strong className="text-gray-900">{selectedStudents.length}</strong> student(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={14} />
                            Delete Selected
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Download size={14} />
                            Export Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Students Display */}
            {viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={() => setSelectAll(!selectAll)}
                                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                        />
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
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</span>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Year</span>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <AnimatePresence>
                                    {filteredStudents.map((student, index) => (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => {
                                                        if (selectedStudents.includes(student.id)) {
                                                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                                            setSelectAll(false);
                                                        } else {
                                                            setSelectedStudents([...selectedStudents, student.id]);
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                        {student.photo ? (
                                                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-medium text-gray-600">
                                                                {student.name?.split(' ').map(n => n[0]).join('')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                                        <p className="text-xs text-gray-500">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">{student.student_id}</p>
                                                <p className="text-xs text-gray-500">Roll: {student.roll_no}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">{student.department_name}</p>
                                                <p className="text-xs text-gray-500">{student.course_name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">{student.mobile}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                    Year {student.year}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedStudent(student)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(student)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setStudentToDelete(student);
                                                            setShowDeleteConfirm(true);
                                                        }}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-12">
                            <Users size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-sm font-medium text-gray-900">No students found</h3>
                            <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Showing {filteredStudents.length} of {pagination.totalRecords} students
                                </p>
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

                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
                        <motion.div
                            key={student.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                                        {student.photo ? (
                                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-gray-600">
                                                {student.name?.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">{student.name}</h3>
                                        <p className="text-xs text-gray-500">{student.student_id}</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => {
                                        if (selectedStudents.includes(student.id)) {
                                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                        } else {
                                            setSelectedStudents([...selectedStudents, student.id]);
                                        }
                                    }}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                />
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-xs">
                                    <BookOpen size={12} className="text-gray-400" />
                                    <span className="text-gray-600">{student.department_name} - {student.course_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <GraduationCap size={12} className="text-gray-400" />
                                    <span className="text-gray-600">Year {student.year} • Semester {student.semester}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Mail size={12} className="text-gray-400" />
                                    <span className="text-gray-600">{student.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Phone size={12} className="text-gray-400" />
                                    <span className="text-gray-600">{student.mobile}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-xs text-gray-500">Roll: {student.roll_no}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setSelectedStudent(student)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Eye size={14} className="text-gray-500" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(student)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Edit2 size={14} className="text-gray-500" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStudentToDelete(student);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Trash2 size={14} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add/Edit Student Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                                </h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Personal Information */}
                                    <div className="col-span-2">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Student ID *</label>
                                        <input
                                            type="text"
                                            value={form.student_id}
                                            onChange={e => setForm({ ...form, student_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                                        <select
                                            value={form.gender}
                                            onChange={e => setForm({ ...form, gender: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">Select Gender</option>
                                            {genders.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={form.date_of_birth}
                                            onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        />
                                    </div>

                                    {/* Academic Information */}
                                    <div className="col-span-2 mt-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Academic Information</h3>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                                        <select
                                            value={form.department}
                                            onChange={e => {
                                                setForm({ ...form, department: e.target.value });
                                                fetchCourses(e.target.value);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.filter(d => d !== 'All').map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
                                        <select
                                            value={form.course}
                                            onChange={e => setForm({ ...form, course: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">Select Course</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>{course.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                                        <select
                                            value={form.year}
                                            onChange={e => setForm({ ...form, year: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">Select Year</option>
                                            {years.map(year => (
                                                <option key={year} value={year}>Year {year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Semester</label>
                                        <select
                                            value={form.semester}
                                            onChange={e => setForm({ ...form, semester: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">Select Semester</option>
                                            {semesters.map(sem => (
                                                <option key={sem} value={sem}>Semester {sem}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Division</label>
                                        <select
                                            value={form.division}
                                            onChange={e => setForm({ ...form, division: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">Select Division</option>
                                            {divisions.map(div => (
                                                <option key={div} value={div}>Division {div}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Roll Number *</label>
                                        <input
                                            type="text"
                                            value={form.roll_no}
                                            onChange={e => setForm({ ...form, roll_no: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                            required
                                        />
                                    </div>

                                    {/* Contact Information */}
                                    <div className="col-span-2 mt-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Mobile *</label>
                                        <input
                                            type="tel"
                                            value={form.mobile}
                                            onChange={e => setForm({ ...form, mobile: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                            required
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                                        <textarea
                                            value={form.address}
                                            onChange={e => setForm({ ...form, address: e.target.value })}
                                            rows="2"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        />
                                    </div>

                                    {/* Additional Information */}
                                    <div className="col-span-2 mt-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h3>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Blood Group</label>
                                        <select
                                            value={form.blood_group}
                                            onChange={e => setForm({ ...form, blood_group: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        >
                                            <option value="">Select Blood Group</option>
                                            {bloodGroups.map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Emergency Contact</label>
                                        <input
                                            type="tel"
                                            value={form.emergency_contact}
                                            onChange={e => setForm({ ...form, emergency_contact: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Photo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setForm({ ...form, photo: e.target.files[0] })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                        {editingStudent?.photo && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Current: {editingStudent.photo}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader size={16} className="animate-spin" />
                                                {editingStudent ? 'Updating...' : 'Adding...'}
                                            </>
                                        ) : (
                                            editingStudent ? 'Update Student' : 'Add Student'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Student Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedStudent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-xl max-w-2xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Student Details</h2>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">
                                        {selectedStudent.photo ? (
                                            <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-600">
                                                {selectedStudent.name?.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                                        <p className="text-sm text-gray-500">{selectedStudent.student_id}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Personal Information</h4>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Gender</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.gender || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Date of Birth</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.date_of_birth || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Blood Group</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.blood_group || '-'}</p>
                                    </div>

                                    <div className="col-span-2 mt-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Academic Information</h4>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Department</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.department_name || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Course</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.course_name || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Year / Semester</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedStudent.year ? `Year ${selectedStudent.year}` : '-'} / {selectedStudent.semester ? `Semester ${selectedStudent.semester}` : '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Division / Roll No</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedStudent.division ? `Div ${selectedStudent.division}` : '-'} / {selectedStudent.roll_no || '-'}
                                        </p>
                                    </div>

                                    <div className="col-span-2 mt-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Information</h4>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.email}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500">Mobile</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.mobile}</p>
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500">Address</p>
                                        <p className="text-sm font-medium text-gray-900">{selectedStudent.address || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        handleEdit(selectedStudent);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={24} className="text-red-600" />
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                Delete Student
                            </h3>

                            <p className="text-sm text-gray-500 text-center mb-6">
                                Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(studentToDelete?.id)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Import Modal */}
            <AnimatePresence>
                {importModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setImportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Import Students</h3>
                                <button
                                    onClick={() => setImportModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-4">
                                Upload a CSV or Excel file with student data. The file should contain columns for student_id, name, email, etc.
                            </p>

                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleImport}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4"
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setImportModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentPage;