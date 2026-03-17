import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Main Pages
import DashboardAnalytics from './pages/DashboardAnalytics';
import StudentPage from './pages/StudentPage';
import RecognitionPage from './pages/RecognitionPage';
import TrainPage from './pages/TrainPage';
import AttendancePage from './pages/AttendancePage';
import ChatbotPage from './pages/ChatbotPage';
import StudentDashboard from './pages/StudentDashboard';

// Layout Component
import MainLayout from './components/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setUserRole(user.role);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole && requiredRole !== 'any') {
    if (userRole === 'student') {
      return <Navigate to="/student-dashboard" />;
    }
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  // Set up axios defaults
  useEffect(() => {
    // Set base URL
    axios.defaults.baseURL = 'http://127.0.0.1:8000';

    // Request interceptor to add token
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await axios.post('/api/token/refresh/', {
              refresh: refreshToken
            });

            if (response.data.access) {
              const newToken = response.data.access;

              // Store new token
              if (localStorage.getItem('access_token')) {
                localStorage.setItem('access_token', newToken);
              } else {
                sessionStorage.setItem('access_token', newToken);
              }

              // Update authorization header
              axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

              // Retry the original request
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);

            // Clear all tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }, []);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Admin Routes with Layout */}
        <Route path="/" element={
          <ProtectedRoute requiredRole="any">
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardAnalytics />} />
          <Route path="students" element={<StudentPage />} />
          <Route path="recognition" element={<RecognitionPage />} />
          <Route path="train" element={<TrainPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="help" element={<ChatbotPage />} />
        </Route>

        {/* Student Dashboard */}
        <Route path="/student-dashboard" element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;