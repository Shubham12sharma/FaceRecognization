from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'attendance', views.AttendanceViewSet)

urlpatterns = [
    # Auth (remove token endpoints from here since they're in main urls.py)
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.get_user_profile, name='profile'),
    path('change-password/', views.change_password, name='change_password'),
    path('attendance/export/', views.export_attendance, name='export_attendance'),
    
    # Dashboard
    path('dashboard/stats/', views.get_dashboard_stats, name='dashboard_stats'),
    path('dashboard/weekly-attendance/', views.get_weekly_attendance, name='weekly_attendance'),
    path('dashboard/department-distribution/', views.get_department_distribution, name='department_distribution'),
    path('dashboard/recent-activity/', views.get_recent_activity, name='recent_activity'),
    
    # Recognition
    path('recognize/', views.recognize_face, name='recognize'),

    path('departments/', views.get_departments, name='departments'),
    path('attendance/export/csv/', views.export_attendance_csv, name='export_attendance_csv'),
    
    # Training
    path('train/', views.train_model, name='train'),
    path('model/info/', views.get_model_info, name='model_info'),
    path('dataset/stats/', views.get_dataset_stats, name='dataset_stats'),
    path('training/history/', views.get_training_history, name='training_history'),
    path('model/export/', views.export_model, name='export_model'),
    
    # Notifications
    path('notifications/', views.get_notifications, name='notifications'),
    path('notifications/<int:pk>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    
    # Student Dashboard
    path('student/dashboard/', views.get_student_dashboard, name='student_dashboard'),
    
    # Include router URLs
    path('', include(router.urls)),
]