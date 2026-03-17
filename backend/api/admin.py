from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import *

# Custom admin site configuration
admin.site.site_header = "Face Recognition Attendance System Administration"
admin.site.site_title = "FaceRecog Admin"
admin.site.index_title = "Welcome to Face Recognition Attendance System"

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'student_count', 'created_at']
    search_fields = ['name', 'code']
    list_filter = ['created_at']
    ordering = ['name']
    
    def student_count(self, obj):
        count = Student.objects.filter(department=obj).count()
        url = reverse('admin:api_student_changelist') + f'?department__id__exact={obj.id}'
        return format_html('<a href="{}">{} Students</a>', url, count)
    student_count.short_description = 'Students'

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'department', 'duration_years', 'student_count', 'created_at']
    search_fields = ['name', 'code']
    list_filter = ['department', 'duration_years', 'created_at']
    ordering = ['department__name', 'name']
    
    def student_count(self, obj):
        count = Student.objects.filter(course=obj).count()
        return format_html('<b>{}</b>', count)
    student_count.short_description = 'Students'

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    readonly_fields = ['date', 'time', 'status', 'confidence', 'recognized_by']
    can_delete = False
    max_num = 10

class RecognitionLogInline(admin.TabularInline):
    model = RecognitionLog
    extra = 0
    readonly_fields = ['timestamp', 'confidence', 'recognized', 'image_preview']
    can_delete = False
    max_num = 10
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />', obj.image.url)
        return "No image"
    image_preview.short_description = 'Preview'

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'photo_preview', 'name', 'roll_no', 'email', 'mobile', 
                   'department', 'year', 'semester', 'attendance_rate', 'is_active', 'created_at']
    list_display_links = ['student_id', 'name']
    search_fields = ['student_id', 'name', 'roll_no', 'email', 'mobile']
    list_filter = ['department', 'course', 'year', 'semester', 'division', 'gender', 
                   'is_active', 'created_at']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'face_encoding', 'photo_preview']
    fieldsets = (
        ('Basic Information', {
            'fields': ('student_id', 'roll_no', 'name', 'photo', 'photo_preview', 'is_active')
        }),
        ('Account Information', {
            'fields': ('user', 'email', 'mobile')
        }),
        ('Academic Information', {
            'fields': ('department', 'course', 'year', 'semester', 'division')
        }),
        ('Personal Information', {
            'fields': ('gender', 'date_of_birth', 'blood_group', 'address', 'emergency_contact')
        }),
        ('Face Recognition', {
            'fields': ('face_encoding',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    inlines = [AttendanceInline, RecognitionLogInline]
    actions = ['activate_students', 'deactivate_students', 'export_selected_students']
    
    def photo_preview(self, obj):
        if obj.photo:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%; object-fit: cover;" />', obj.photo.url)
        return format_html('<div style="width: 50px; height: 50px; background: #e0e0e0; border-radius: 50%; display: flex; align-items: center; justify-content: center;">📷</div>')
    photo_preview.short_description = 'Photo'
    
    def attendance_rate(self, obj):
        total = Attendance.objects.filter(student=obj).count()
        if total == 0:
            return format_html('<span style="color: #999;">No records</span>')
        present = Attendance.objects.filter(student=obj, status='present').count()
        rate = (present / total) * 100
        color = 'green' if rate >= 75 else 'orange' if rate >= 50 else 'red'
        return format_html('<span style="color: {}; font-weight: bold;">{}%</span>', color, round(rate, 1))
    attendance_rate.short_description = 'Attendance Rate'
    
    def activate_students(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} students activated successfully.")
    activate_students.short_description = "Activate selected students"
    
    def deactivate_students(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} students deactivated successfully.")
    deactivate_students.short_description = "Deactivate selected students"
    
    def export_selected_students(self, request, queryset):
        import csv
        from django.http import HttpResponse
        from datetime import datetime
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="students_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Student ID', 'Roll No', 'Name', 'Email', 'Mobile', 'Department', 
                        'Course', 'Year', 'Semester', 'Division', 'Gender', 'Date of Birth', 
                        'Blood Group', 'Address', 'Emergency Contact', 'Active'])
        
        for student in queryset:
            writer.writerow([
                student.student_id,
                student.roll_no,
                student.name,
                student.email,
                student.mobile,
                student.department.name if student.department else '',
                student.course.name if student.course else '',
                student.get_year_display(),
                student.get_semester_display(),
                student.division,
                student.get_gender_display(),
                student.date_of_birth,
                student.blood_group,
                student.address,
                student.emergency_contact,
                'Yes' if student.is_active else 'No'
            ])
        
        return response
    export_selected_students.short_description = "Export selected students to CSV"

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student_info', 'date', 'time', 'status_colored', 'confidence_bar', 'recognized_by']
    list_display_links = ['student_info']
    search_fields = ['student__name', 'student__student_id', 'student__roll_no']
    list_filter = ['status', 'date', 'recognized_by']
    date_hierarchy = 'date'
    ordering = ['-date', '-time']
    readonly_fields = ['confidence', 'recognized_by']
    
    def student_info(self, obj):
        url = reverse('admin:api_student_change', args=[obj.student.id])
        return format_html('<a href="{}"><b>{}</b><br><small>{}</small></a>', 
                          url, obj.student.name, obj.student.student_id)
    student_info.short_description = 'Student'
    student_info.admin_order_field = 'student__name'
    
    def status_colored(self, obj):
        colors = {
            'present': '#28a745',
            'absent': '#dc3545',
            'late': '#ffc107',
            'holiday': '#6c757d'
        }
        return format_html('<span style="color: {}; font-weight: bold;">⬤ {}</span>', 
                          colors.get(obj.status, '#000'), obj.status.title())
    status_colored.short_description = 'Status'
    status_colored.admin_order_field = 'status'
    
    def confidence_bar(self, obj):
        if obj.confidence:
            color = '#28a745' if obj.confidence >= 90 else '#ffc107' if obj.confidence >= 75 else '#dc3545'
            return format_html('''
                <div style="width: 100px; background: #e9ecef; border-radius: 10px; overflow: hidden;">
                    <div style="width: {}%; background: {}; height: 20px; text-align: center; 
                                line-height: 20px; color: white; font-size: 10px;">
                        {}%
                    </div>
                </div>
            ''', obj.confidence, color, obj.confidence)
        return '-'
    confidence_bar.short_description = 'Confidence'

@admin.register(RecognitionLog)
class RecognitionLogAdmin(admin.ModelAdmin):
    list_display = ['thumbnail', 'student_info', 'timestamp', 'confidence_colored', 'recognized_status']
    list_display_links = ['thumbnail', 'student_info']
    search_fields = ['student__name', 'student__student_id']
    list_filter = ['recognized', 'timestamp']
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    readonly_fields = ['image_preview', 'confidence', 'recognized']
    
    def thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 5px; object-fit: cover;" />', obj.image.url)
        return format_html('<div style="width: 50px; height: 50px; background: #e0e0e0; border-radius: 5px;"></div>')
    thumbnail.short_description = 'Image'
    
    def student_info(self, obj):
        if obj.student:
            url = reverse('admin:api_student_change', args=[obj.student.id])
            return format_html('<a href="{}"><b>{}</b></a>', url, obj.student.name)
        return format_html('<span style="color: #999;">Unknown</span>')
    student_info.short_description = 'Student'
    
    def confidence_colored(self, obj):
        color = '#28a745' if obj.confidence >= 90 else '#ffc107' if obj.confidence >= 75 else '#dc3545'
        return format_html('<span style="color: {}; font-weight: bold;">{}%</span>', color, obj.confidence)
    confidence_colored.short_description = 'Confidence'
    
    def recognized_status(self, obj):
        if obj.recognized:
            return format_html('<span style="color: #28a745;">✅ Recognized</span>')
        return format_html('<span style="color: #dc3545;">❌ Not Recognized</span>')
    recognized_status.short_description = 'Status'
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-width: 300px; max-height: 300px; border-radius: 10px;" />', obj.image.url)
        return "No image"
    image_preview.short_description = 'Image Preview'

@admin.register(TrainingLog)
class TrainingLogAdmin(admin.ModelAdmin):
    list_display = ['algorithm', 'accuracy_colored', 'precision', 'recall', 'f1_score', 
                   'num_persons', 'num_images', 'training_time_display', 'created_at']
    list_filter = ['algorithm', 'created_at']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def accuracy_colored(self, obj):
        color = '#28a745' if obj.accuracy >= 90 else '#ffc107' if obj.accuracy >= 75 else '#dc3545'
        return format_html('<span style="color: {}; font-weight: bold;">{}%</span>', color, obj.accuracy)
    accuracy_colored.short_description = 'Accuracy'
    
    def training_time_display(self, obj):
        minutes = int(obj.training_time // 60)
        seconds = int(obj.training_time % 60)
        if minutes > 0:
            return f"{minutes}m {seconds}s"
        return f"{seconds}s"
    training_time_display.short_description = 'Training Time'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type_colored', 'read_status', 'created_at']
    list_filter = ['notification_type', 'read', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def notification_type_colored(self, obj):
        colors = {
            'info': '#17a2b8',
            'success': '#28a745',
            'warning': '#ffc107',
            'error': '#dc3545'
        }
        return format_html('<span style="color: {}; font-weight: bold;">⬤ {}</span>', 
                          colors.get(obj.notification_type, '#000'), obj.notification_type.title())
    notification_type_colored.short_description = 'Type'
    
    def read_status(self, obj):
        if obj.read:
            return format_html('<span style="color: #28a745;">✓ Read</span>')
        return format_html('<span style="color: #ffc107;">○ Unread</span>')
    read_status.short_description = 'Status'

# Custom filters for better filtering experience
class YearListFilter(admin.SimpleListFilter):
    title = 'year'
    parameter_name = 'year'
    
    def lookups(self, request, model_admin):
        return [
            ('1', '1st Year'),
            ('2', '2nd Year'),
            ('3', '3rd Year'),
            ('4', '4th Year'),
        ]
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(year=self.value())

class SemesterListFilter(admin.SimpleListFilter):
    title = 'semester'
    parameter_name = 'semester'
    
    def lookups(self, request, model_admin):
        return [(str(i), f'Semester {i}') for i in range(1, 9)]
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(semester=self.value())

# Dashboard widgets
class DashboardStats:
    def __init__(self):
        self.total_students = Student.objects.filter(is_active=True).count()
        self.today_present = Attendance.objects.filter(date=date.today(), status='present').count()
        self.today_absent = Attendance.objects.filter(date=date.today(), status='absent').count()
        self.total_recognitions = RecognitionLog.objects.count()
        self.last_training = TrainingLog.objects.first()
        
    def get_context(self):
        return {
            'total_students': self.total_students,
            'today_present': self.today_present,
            'today_absent': self.today_absent,
            'total_recognitions': self.total_recognitions,
            'last_training': self.last_training,
        }

# Custom admin dashboard
class CustomAdminSite(admin.AdminSite):
    def get_app_list(self, request):
        app_list = super().get_app_list(request)
        app_list += [
            {
                'name': 'Dashboard',
                'app_label': 'dashboard',
                'models': [
                    {
                        'name': 'Statistics',
                        'object_name': 'DashboardStats',
                        'admin_url': '/admin/dashboard/',
                        'view_only': True,
                    }
                ]
            }
        ]
        return app_list

