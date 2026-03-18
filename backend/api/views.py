import os
import cv2
import numpy as np
import pickle
import json
import time
from datetime import date, datetime, timedelta
from django.conf import settings
from django.db.models import Count, Q, Avg, Sum
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from .serializers import *
from .face_recognition import FaceRecognizer
from .utils import *

# Initialize face recognizer
face_recognizer = FaceRecognizer()

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'success': False,
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            
            # Get user role
            if user.is_superuser:
                role = 'admin'
            elif hasattr(user, 'student'):
                role = 'student'
            else:
                role = 'staff'
            
            # Get student details if applicable
            student_data = None
            if hasattr(user, 'student'):
                student = user.student
                student_data = {
                    'id': student.id,
                    'student_id': student.student_id,
                    'name': student.name,
                    'roll_no': student.roll_no,
                    'department': student.department.name if student.department else None,
                    'year': student.year,
                    'photo': student.photo.url if student.photo else None
                }
            
            return Response({
                'success': True,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': role,
                    'student': student_data
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'error': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'confirm_password', 'role']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'success': False,
                    'error': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if passwords match
        if data['password'] != data['confirm_password']:
            return Response({
                'success': False,
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            return Response({
                'success': False,
                'error': 'Username already taken'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            return Response({
                'success': False,
                'error': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )
        
        # If registering as student, create student profile
        if data['role'] == 'student':
            # Get or create default department
            dept, _ = Department.objects.get_or_create(
                name=data.get('department', 'General'),
                defaults={'code': 'GEN'}
            )
            
            student = Student.objects.create(
                user=user,
                student_id=data.get('student_id', f"STU{user.id:04d}"),
                roll_no=data.get('roll_no', f"R{user.id:04d}"),
                name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
                email=data['email'],
                mobile=data.get('mobile', ''),
                department=dept,
                year=data.get('year', '1'),
                semester=data.get('semester', '1'),
                division=data.get('division', 'A'),
                gender=data.get('gender', ''),
                date_of_birth=data.get('date_of_birth') or None,
                address=data.get('address', '')
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Registration successful',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': data['role']
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    
    if hasattr(user, 'student'):
        student = user.student
        serializer = StudentSerializer(student)
        return Response({
            'user': UserSerializer(user).data,
            'student': serializer.data,
            'role': 'student'
        })
    else:
        return Response({
            'user': UserSerializer(user).data,
            'role': 'admin' if user.is_superuser else 'staff'
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Dashboard Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    today = date.today()
    
    total_students = Student.objects.filter(is_active=True).count()
    present_today = Attendance.objects.filter(date=today, status='present').count()
    absent_today = Attendance.objects.filter(date=today, status='absent').count()
    late_today = Attendance.objects.filter(date=today, status='late').count()
    
    # Calculate attendance rate for last 30 days
    last_30_days = date.today() - timedelta(days=30)
    attendance_records = Attendance.objects.filter(date__gte=last_30_days)
    if attendance_records.exists():
        attendance_rate = (attendance_records.filter(status='present').count() / 
                          attendance_records.count() * 100)
    else:
        attendance_rate = 0
    
    # Get latest training log
    latest_training = TrainingLog.objects.first()
    model_accuracy = latest_training.accuracy if latest_training else 0
    
    # Calculate average recognition confidence
    avg_confidence = RecognitionLog.objects.filter(
        timestamp__date=today, recognized=True
    ).aggregate(Avg('confidence'))['confidence__avg'] or 0
    
    # Get total images in dataset
    data_path = settings.FACE_RECOGNITION['DATA_PATH']
    total_images = 0
    if os.path.exists(data_path):
        for root, dirs, files in os.walk(data_path):
            total_images += len([f for f in files if f.endswith(('.jpg', '.png', '.jpeg'))])
    
    stats = {
        'total_students': total_students,
        'present_today': present_today,
        'absent_today': absent_today,
        'late_today': late_today,
        'recognition_accuracy': round(avg_confidence, 1),
        'model_accuracy': round(model_accuracy, 1),
        'total_images': total_images,
        'attendance_rate': round(attendance_rate, 1)
    }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_weekly_attendance(request):
    today = date.today()
    week_dates = [today - timedelta(days=i) for i in range(7)]
    week_dates.reverse()
    
    data = []
    for d in week_dates:
        present = Attendance.objects.filter(date=d, status='present').count()
        absent = Attendance.objects.filter(date=d, status='absent').count()
        late = Attendance.objects.filter(date=d, status='late').count()
        
        data.append({
            'date': d.strftime('%Y-%m-%d'),
            'day': d.strftime('%a'),
            'present': present,
            'absent': absent,
            'late': late
        })
    
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_department_distribution(request):
    departments = Department.objects.annotate(
        student_count=Count('student', filter=Q(student__is_active=True))
    )
    
    data = []
    for dept in departments:
        if dept.student_count > 0:
            data.append({
                'name': dept.name,
                'value': dept.student_count,
                'code': dept.code
            })
    
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_activity(request):
    recent = RecognitionLog.objects.select_related('student')[:10]
    serializer = RecognitionLogSerializer(recent, many=True)
    return Response(serializer.data)

# Student Views
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer
    
    @action(detail=True, methods=['post'])
    def upload_photos(self, request, pk=None):
        student = self.get_object()
        files = request.FILES.getlist('photos')
        
        if not files:
            return Response({'error': 'No files uploaded'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create student directory if not exists
        student_dir = os.path.join(
            settings.FACE_RECOGNITION['DATA_PATH'], 
            student.student_id
        )
        os.makedirs(student_dir, exist_ok=True)
        
        saved_files = []
        for file in files:
            file_path = os.path.join(student_dir, file.name)
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            saved_files.append(file.name)
        
        return Response({
            'message': f'Uploaded {len(saved_files)} photos successfully',
            'files': saved_files
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        students = Student.objects.filter(
            Q(name__icontains=query) |
            Q(student_id__icontains=query) |
            Q(roll_no__icontains=query) |
            Q(email__icontains=query)
        )[:20]
        
        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)

# Attendance Views
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Attendance.objects.all()
        
        # Filter by date
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)
        
        # Filter by department
        dept_param = self.request.query_params.get('department')
        if dept_param:
            queryset = queryset.filter(student__department_id=dept_param)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = date.today()
        attendance = Attendance.objects.filter(date=today)
        serializer = self.get_serializer(attendance, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        summary = Attendance.objects.filter(
            date__range=[start_date, end_date]
        ).values('date', 'status').annotate(
            count=Count('id')
        ).order_by('date')
        
        return Response(summary)

# Recognition Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recognize_face(request):
    """Recognize face from uploaded image"""
    try:
        image_data = request.data.get('image')
        threshold = request.data.get('threshold', 80)
        
        if not image_data:
            return Response({
                'recognized': False,
                'error': 'No image provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if model exists and is trained
        model_path = settings.FACE_RECOGNITION['CLASSIFIER_PATH']
        if not os.path.exists(model_path):
            return Response({
                'recognized': False,
                'error': 'Model not trained yet. Please train the model first.',
                'message': 'Model not trained'
            }, status=status.HTTP_200_OK)  # Return 200 but with recognized=False
        
        # Save image temporarily
        temp_path = save_base64_image(image_data)
        
        try:
            # Perform recognition
            result = face_recognizer.recognize(temp_path, threshold)
            
            # Log the recognition attempt
            try:
                student = None
                if result['recognized'] and result['student_id']:
                    # Try to find student by student_id (which is the folder name)
                    student_name = result['student_id'].replace('_', ' ').title()
                    # You might need to adjust this based on how you store student IDs
                    student = Student.objects.filter(name__icontains=student_name).first()
                
                RecognitionLog.objects.create(
                    student=student,
                    confidence=result['confidence'],
                    recognized=result['recognized'],
                    image=temp_path
                )
            except Exception as log_error:
                print(f"Error logging recognition: {log_error}")
            
            # If recognized, mark attendance
            if result['recognized'] and result['student_id']:
                try:
                    # Try to find student by name or create a record
                    student_name = result['student_id'].replace('_', ' ').title()
                    student = Student.objects.filter(name__icontains=student_name).first()
                    
                    if student:
                        attendance, created = Attendance.objects.get_or_create(
                            student=student,
                            date=date.today(),
                            defaults={
                                'status': 'present',
                                'confidence': result['confidence'],
                                'recognized_by': request.user
                            }
                        )
                        
                        if not created and attendance.status == 'absent':
                            attendance.status = 'present'
                            attendance.confidence = result['confidence']
                            attendance.save()
                        
                        result['student'] = {
                            'id': student.id,
                            'student_id': student.student_id,
                            'name': student.name,
                            'roll_no': student.roll_no,
                            'department': student.department.name if student.department else None,
                            'department_name': student.department.name if student.department else None,
                            'photo': request.build_absolute_uri(student.photo.url) if student.photo else None
                        }
                except Exception as att_error:
                    print(f"Error marking attendance: {att_error}")
            
            return Response(result)
        
        except Exception as e:
            print(f"Recognition error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'recognized': False,
                'error': str(e),
                'message': 'Recognition failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        print(f"General error in recognize_face: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'recognized': False,
            'error': str(e),
            'message': 'Server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# Training Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_model(request):
    algorithm = request.data.get('algorithm', 'lbph')
    hyperparameters = request.data.get('hyperparameters', {})
    
    start_time = time.time()
    
    try:
        # Train the model
        result = face_recognizer.train(algorithm, hyperparameters)
        
        training_time = time.time() - start_time
        
        # Save training log
        TrainingLog.objects.create(
            algorithm=algorithm,
            accuracy=result.get('accuracy', 0),
            precision=result.get('precision', 0),
            recall=result.get('recall', 0),
            f1_score=result.get('f1_score', 0),
            training_time=training_time,
            num_persons=result.get('num_persons', 0),
            num_images=result.get('num_images', 0)
        )
        
        # Create notification
        Notification.objects.create(
            user=request.user,
            title='Training Completed',
            message=f'Model trained with {result.get("accuracy", 0)}% accuracy',
            notification_type='success'
        )
        
        return Response({
            'message': 'Training completed successfully',
            'algorithm': algorithm,
            'training_time': training_time,
            **result
        })
        
    except Exception as e:
        Notification.objects.create(
            user=request.user,
            title='Training Failed',
            message=str(e),
            notification_type='error'
        )
        
        return Response({'error': str(e)}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_model_info(request):
    info = face_recognizer.get_model_info()
    return Response(info)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dataset_stats(request):
    data_path = settings.FACE_RECOGNITION['DATA_PATH']
    
    if not os.path.exists(data_path):
        return Response({
            'totalPersons': 0,
            'totalImages': 0,
            'avgImagesPerPerson': 0,
            'lastUpdated': 'Never'
        })
    
    persons = []
    total_images = 0
    
    for person_dir in os.listdir(data_path):
        person_path = os.path.join(data_path, person_dir)
        if os.path.isdir(person_path):
            images = [f for f in os.listdir(person_path) 
                     if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            persons.append({
                'name': person_dir,
                'image_count': len(images)
            })
            total_images += len(images)
    
    if persons:
        avg_images = total_images / len(persons)
        # Get last modified time
        last_modified = 0
        for person_dir in os.listdir(data_path):
            person_path = os.path.join(data_path, person_dir)
            if os.path.isdir(person_path):
                mod_time = os.path.getmtime(person_path)
                if mod_time > last_modified:
                    last_modified = mod_time
        
        last_updated = datetime.fromtimestamp(last_modified).strftime('%Y-%m-%d %H:%M') if last_modified > 0 else 'Never'
    else:
        avg_images = 0
        last_updated = 'Never'
    
    return Response({
        'totalPersons': len(persons),
        'totalImages': total_images,
        'avgImagesPerPerson': round(avg_images, 1) if persons else 0,
        'lastUpdated': last_updated,
        'persons': persons
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_training_history(request):
    history = TrainingLog.objects.all()[:10]
    serializer = TrainingLogSerializer(history, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_model(request):
    model_path = settings.FACE_RECOGNITION['CLASSIFIER_PATH']
    
    if not os.path.exists(model_path):
        return Response({'error': 'No model found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    from django.http import FileResponse
    return FileResponse(open(model_path, 'rb'), 
                       as_attachment=True, 
                       filename='face_recognition_model.xml')

# Notification Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.filter(user=request.user)[:20]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
        notification.read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({'message': 'All notifications marked as read'})

# Student Dashboard Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_dashboard(request):
    user = request.user
    
    if not hasattr(user, 'student'):
        return Response({'error': 'User is not a student'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    student = user.student
    
    # Get attendance summary
    total_days = Attendance.objects.filter(student=student).count()
    present_days = Attendance.objects.filter(student=student, status='present').count()
    attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
    
    # Get recent attendance
    recent_attendance = Attendance.objects.filter(student=student)[:10]
    attendance_serializer = AttendanceSerializer(recent_attendance, many=True)
    
    # Get recognition logs
    recent_logs = RecognitionLog.objects.filter(student=student)[:10]
    logs_serializer = RecognitionLogSerializer(recent_logs, many=True)
    
    # Get upcoming schedule (you can customize this based on your needs)
    today = date.today()
    next_days = [today + timedelta(days=i) for i in range(7)]
    
    schedule = []
    for d in next_days:
        schedule.append({
            'date': d.strftime('%Y-%m-%d'),
            'day': d.strftime('%A'),
            'status': 'Holiday' if d.weekday() >= 5 else 'Regular'
        })
    
    return Response({
        'student': StudentSerializer(student).data,
        'attendance_summary': {
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': total_days - present_days,
            'attendance_percentage': round(attendance_percentage, 1)
        },
        'recent_attendance': attendance_serializer.data,
        'recent_logs': logs_serializer.data,
        'upcoming_schedule': schedule
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_attendance(request):
    """Export attendance data as CSV"""
    import csv
    from django.http import HttpResponse
    from datetime import datetime
    
    # Get date range from query params
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Filter attendance records
    queryset = Attendance.objects.all().select_related('student')
    
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="attendance_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Student ID', 'Name', 'Department', 'Date', 'Time', 'Status', 'Confidence'])
    
    for attendance in queryset:
        writer.writerow([
            attendance.student.student_id,
            attendance.student.name,
            attendance.student.department.name if attendance.student.department else '',
            attendance.date,
            attendance.time.strftime('%H:%M:%S') if attendance.time else '',
            attendance.status,
            attendance.confidence
        ])
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_departments(request):
    """Get all departments"""
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_courses(request):
    """Get all courses, optionally filtered by department"""
    try:
        department_id = request.query_params.get('department')
        if department_id:
            courses = Course.objects.filter(department_id=department_id).order_by('name')
        else:
            courses = Course.objects.all().order_by('name')
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_attendance_csv(request):
    """Export attendance data as CSV"""
    import csv
    from django.http import HttpResponse
    from datetime import datetime
    
    # Get date range from query params
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    date = request.query_params.get('date')
    
    # Filter attendance records
    queryset = Attendance.objects.all().select_related('student')
    
    if date:
        queryset = queryset.filter(date=date)
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="attendance_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Student ID', 'Name', 'Department', 'Roll No', 'Date', 'Time', 'Status', 'Confidence'])
    
    for attendance in queryset:
        writer.writerow([
            attendance.student.student_id if attendance.student else '',
            attendance.student.name if attendance.student else '',
            attendance.student.department.name if attendance.student and attendance.student.department else '',
            attendance.student.roll_no if attendance.student else '',
            attendance.date,
            attendance.time.strftime('%H:%M:%S') if attendance.time else '',
            attendance.status,
            attendance.confidence
        ])
    
    return response

# In your backend/api/views.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_staff(request):
    """Get all staff users (non-superuser staff accounts)"""
    try:
        # Get users who are staff but not superuser
        staff_users = User.objects.filter(is_staff=True, is_superuser=False)
        
        # Also include regular users who might be staff
        # You can adjust this based on your user model
        staff_data = []
        for user in staff_users:
            staff_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'is_staff': user.is_staff,
                'date_joined': user.date_joined
            })
        
        return Response(staff_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_model(request):
    """Export the trained model file"""
    model_path = settings.FACE_RECOGNITION['CLASSIFIER_PATH']
    
    if not os.path.exists(model_path):
        return Response({'error': 'No model found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        response = FileResponse(
            open(model_path, 'rb'),
            as_attachment=True,
            filename=f'face_recognition_model_{datetime.now().strftime("%Y%m%d")}.xml'
        )
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_face_images(request, person_id):
    """Upload face images for a student/staff"""
    try:
        files = request.FILES.getlist('photos')
        
        if not files:
            return Response({'error': 'No files uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Try to find as student first
        from .models import Student
        try:
            student = Student.objects.get(student_id=person_id)
            person_dir = f"{student.student_id}_{student.name.replace(' ', '_')}"
            person_name = student.name
        except Student.DoesNotExist:
            # Try as staff (User)
            try:
                staff = User.objects.get(id=person_id)
                person_dir = f"staff_{staff.id}_{staff.username}"
                person_name = staff.get_full_name() or staff.username
            except User.DoesNotExist:
                return Response({'error': 'Person not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create directory
        data_path = settings.FACE_RECOGNITION['DATA_PATH']
        person_path = os.path.join(data_path, person_dir)
        os.makedirs(person_path, exist_ok=True)
        
        # Save files
        saved_files = []
        for i, file in enumerate(files):
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"face_{timestamp}_{i:03d}.jpg"
            file_path = os.path.join(person_path, filename)
            
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            saved_files.append(filename)
        
        return Response({
            'success': True,
            'message': f'Successfully uploaded {len(saved_files)} images for {person_name}',
            'files': saved_files,
            'person': person_name,
            'directory': person_dir
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_model_exists(request):
    """Check if a trained model exists"""
    model_path = settings.FACE_RECOGNITION['CLASSIFIER_PATH']
    exists = os.path.exists(model_path)
    
    return Response({
        'exists': exists,
        'path': model_path if exists else None
    })