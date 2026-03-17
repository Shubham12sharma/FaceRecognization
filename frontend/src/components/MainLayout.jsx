import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Users, Camera, Award, Clock,
    MessageCircle, LogOut, ChevronRight, Bell,
    Search, Settings, HelpCircle, Menu, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const MainLayout = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const menu = [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, path: '/dashboard' },
        { id: 'students', label: 'Students', icon: Users, path: '/students' },
        { id: 'recognition', label: 'Live Recognition', icon: Camera, path: '/recognition' },
        { id: 'train', label: 'Train Model', icon: Award, path: '/train' },
        { id: 'attendance', label: 'Attendance', icon: Clock, path: '/attendance' },
        { id: 'help', label: 'AI Help Desk', icon: MessageCircle, path: '/help' },
    ];

    const handleNavigation = (item) => {
        setCurrentPage(item.id);
        navigate(item.path);
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 lg:hidden z-20"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -300 }}
                animate={{ x: isSidebarOpen ? 0 : -300 }}
                transition={{ type: "spring", damping: 20 }}
                className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-gray-200 z-30 flex flex-col`}
            >
                {/* Logo Section */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-gray-900">FaceRecog</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 overflow-y-auto">
                    <div className="space-y-1">
                        {menu.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;

                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleNavigation(item)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                            ? 'bg-gray-900 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.label}

                                    {isActive && (
                                        <motion.div
                                            layoutId="activeDot"
                                            className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Secondary Menu */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <p className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                            Support
                        </p>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
                            <HelpCircle size={18} />
                            Help & Support
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
                            <Settings size={18} />
                            Settings
                        </button>
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                                {user.first_name?.[0]}{user.last_name?.[0] || user.username?.[0]}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        {/* Menu Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 lg:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Breadcrumb */}
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-semibold text-gray-900">
                                {menu.find(item => item.id === currentPage)?.label}
                            </h1>
                            <p className="text-xs text-gray-500">Welcome back, {user.first_name || 'Admin'}</p>
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-48 bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none"
                            />
                        </div>

                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                            <Bell size={18} className="text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 pl-3 border-l border-gray-200"
                            >
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User size={16} className="text-gray-600" />
                                </div>
                            </button>

                            {/* Profile Dropdown */}
                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
                                    >
                                        <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">
                                            Profile
                                        </button>
                                        <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left">
                                            Settings
                                        </button>
                                        <hr className="my-1 border-gray-200" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left"
                                        >
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;