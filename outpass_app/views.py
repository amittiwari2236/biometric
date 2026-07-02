import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from datetime import date, datetime
from .models import Student, OutpassRequest

from django.contrib.auth.models import User

def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'Admin')
        
        if email == 'amittiwari2236@gmail.com' and password == 'Scholar@1910':
            # Find the admin user to log in for session management
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.create_superuser('admin', 'admin@example.com', 'admin')
            login(request, user)
            request.session['role'] = role
            
            if role == 'Super Admin':
                redirect_url = '/super-admin/'
            elif role == 'Gatekeeper':
                redirect_url = '/gatekeeper/'
            else:
                redirect_url = '/'
                
            return JsonResponse({'success': True, 'redirect': redirect_url})
            
        return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
    
    # If GET, render login page
    if request.user.is_authenticated:
        role = request.session.get('role', 'Admin')
        if role == 'Super Admin':
            return redirect('superadmin_dashboard')
        elif role == 'Gatekeeper':
            return redirect('gatekeeper_dashboard')
        return redirect('dashboard')
    
    return render(request, 'login.html')

def logout_view(request):
    role = request.GET.get('role')
    logout(request)
    if role:
        from urllib.parse import urlencode
        return redirect('/login/?' + urlencode({'role': role}))
    return redirect('login')

@login_required(login_url='/login/')
def dashboard(request):
    if request.session.get('role', 'Admin') != 'Admin':
        return redirect('login')
        
    today = date.today()
    requests = OutpassRequest.objects.all().order_by('-start_date', '-id')
    
    total_students = Student.objects.count()
    pending_requests = OutpassRequest.objects.filter(status='Pending').count()
    approved_requests = OutpassRequest.objects.filter(status='Approved').count()
    rejected_requests = OutpassRequest.objects.filter(status='Rejected').count()
    today_requests = OutpassRequest.objects.filter(start_date=today).count()
    
    context = {
        'requests': requests,
        'role': 'Admin',
        'stats': {
            'total_students': total_students,
            'pending_requests': pending_requests,
            'approved_requests': approved_requests,
            'rejected_requests': rejected_requests,
            'today_requests': today_requests
        }
    }
    return render(request, 'dashboard.html', context)

@login_required(login_url='/login/')
def superadmin_dashboard(request):
    if request.session.get('role') != 'Super Admin':
        return redirect('login')
        
    today = date.today()
    requests = OutpassRequest.objects.all().order_by('-start_date', '-id')
    
    context = {
        'requests': requests,
        'role': 'Super Admin',
        'stats': {
            'total_students': Student.objects.count(),
            'pending_requests': OutpassRequest.objects.filter(status='Pending').count(),
            'approved_requests': OutpassRequest.objects.filter(status='Approved').count(),
            'rejected_requests': OutpassRequest.objects.filter(status='Rejected').count(),
            'today_requests': OutpassRequest.objects.filter(start_date=today).count()
        }
    }
    return render(request, 'superadmin_dashboard.html', context)

@login_required(login_url='/login/')
def gatekeeper_dashboard(request):
    if request.session.get('role') != 'Gatekeeper':
        return redirect('login')
        
    today = date.today()
    requests = OutpassRequest.objects.filter(status='Approved', start_date=today).order_by('-start_time')
    
    context = {
        'requests': requests,
        'role': 'Gatekeeper',
        'stats': {
            'today_approved': requests.count()
        }
    }
    return render(request, 'gatekeeper_dashboard.html', context)

@login_required(login_url='/login/')
def student_lookup(request, scholar_id):
    try:
        student = Student.objects.get(scholar_id=scholar_id)
        return JsonResponse({
            'success': True,
            'student_name': student.student_name,
            'mobile_number': student.mobile_number,
            'course': student.course,
            'semester': student.semester,
            'hostel_name': student.hostel_name,
            'room_number': student.room_number,
            'purpose': student.purpose,
            'destination': student.destination
        })
    except Student.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Student not found'}, status=404)

@login_required(login_url='/login/')
@require_POST
def create_request(request):
    data = json.loads(request.body)
    scholar_id = data.get('scholar_id')
    purpose = data.get('purpose', '')
    destination = data.get('destination', '')
    
    try:
        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        start_time = datetime.strptime(data.get('start_time'), '%H:%M').time()
        end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        end_time = datetime.strptime(data.get('end_time'), '%H:%M').time()
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'message': 'Invalid date or time format. Please check your inputs.'}, status=400)
    
    try:
        student = Student.objects.get(scholar_id=scholar_id)
        
        if OutpassRequest.objects.filter(student=student, start_date=start_date).exists():
            return JsonResponse({'success': False, 'message': 'Outpass request already exists for this student today.'}, status=400)
            
        outpass_req = OutpassRequest.objects.create(
            student=student,
            purpose=purpose,
            destination=destination,
            start_date=start_date,
            start_time=start_time,
            end_date=end_date,
            end_time=end_time,
            status='Pending'
        )
        return JsonResponse({
            'success': True,
            'message': 'Outpass request created successfully',
            'id': outpass_req.id,
            'student_name': student.student_name,
            'date': outpass_req.start_date.strftime('%d/%m/%Y'),
            'start_time': outpass_req.start_time.strftime('%I:%M %p'),
            'end_time': outpass_req.end_time.strftime('%I:%M %p'),
            'status': outpass_req.status
        })
    except Student.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Student not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@login_required(login_url='/login/')
@require_POST
def update_status(request):
    data = json.loads(request.body)
    request_id = data.get('id')
    new_status = data.get('status')
    reason = data.get('reason', '').strip()
    
    if new_status not in ['Approved', 'Rejected']:
        return JsonResponse({'success': False, 'message': 'Invalid status'}, status=400)
    
    if not reason:
        return JsonResponse({'success': False, 'message': 'Reason is required.'}, status=400)
        
    try:
        outpass_req = OutpassRequest.objects.get(id=request_id)
        outpass_req.status = new_status
        outpass_req.reason = reason
        outpass_req.save()
        return JsonResponse({'success': True, 'message': f'Request {new_status}'})
    except OutpassRequest.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Request not found'}, status=404)

@login_required(login_url='/login/')
def students_view(request):
    students = Student.objects.all().order_by('scholar_id')
    return render(request, 'students.html', {'students': students})

@login_required(login_url='/login/')
@require_POST
def api_create_student(request):
    data = json.loads(request.body)
    scholar_id = data.get('scholar_id')
    
    if Student.objects.filter(scholar_id=scholar_id).exists():
        return JsonResponse({'success': False, 'message': 'Scholar ID already exists!'}, status=400)
        
    try:
        Student.objects.create(
            scholar_id=scholar_id,
            student_name=data.get('student_name'),
            mobile_number=data.get('mobile_number'),
            course=data.get('course'),
            semester=data.get('semester'),
            hostel_name=data.get('hostel_name'),
            room_number=data.get('room_number'),
            purpose=data.get('purpose', ''),
            destination=data.get('destination', '')
        )
        return JsonResponse({'success': True, 'message': 'Student Saved Successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@login_required(login_url='/login/')
@require_POST
def api_update_student(request):
    data = json.loads(request.body)
    scholar_id = data.get('scholar_id')
    
    try:
        student = Student.objects.get(scholar_id=scholar_id)
        student.student_name = data.get('student_name')
        student.mobile_number = data.get('mobile_number')
        student.course = data.get('course')
        student.semester = data.get('semester')
        student.hostel_name = data.get('hostel_name')
        student.room_number = data.get('room_number')
        student.purpose = data.get('purpose', '')
        student.destination = data.get('destination', '')
        student.save()
        return JsonResponse({'success': True, 'message': 'Student updated successfully!'})
    except Student.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Student not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@login_required(login_url='/login/')
@require_POST
def api_delete_student(request):
    data = json.loads(request.body)
    scholar_id = data.get('scholar_id')
    
    try:
        student = Student.objects.get(scholar_id=scholar_id)
        student.delete()
        return JsonResponse({'success': True, 'message': 'Student deleted successfully!'})
    except Student.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Student not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@login_required(login_url='/login/')
def student_history(request, scholar_id):
    student = get_object_or_404(Student, scholar_id=scholar_id)
    requests = OutpassRequest.objects.filter(student=student).order_by('-start_date', '-start_time')
    
    total = requests.count()
    approved = requests.filter(status='Approved').count()
    pending = requests.filter(status='Pending').count()
    rejected = requests.filter(status='Rejected').count()
    
    history_data = []
    for req in requests:
        history_data.append({
            'start_date': req.start_date.strftime('%d/%m/%Y'),
            'start_time': req.start_time.strftime('%I:%M %p'),
            'end_date': req.end_date.strftime('%d/%m/%Y'),
            'end_time': req.end_time.strftime('%I:%M %p'),
            'purpose': req.purpose,
            'destination': req.destination,
            'status': req.status,
            'reason': req.reason
        })
        
    return JsonResponse({
        'success': True,
        'scholar_id': student.scholar_id,
        'student_name': student.student_name,
        'stats': {
            'total': total,
            'approved': approved,
            'pending': pending,
            'rejected': rejected
        },
        'history': history_data
    })

@login_required(login_url='/login/')
def history_view(request):
    return render(request, 'history.html')

@login_required(login_url='/login/')
def api_all_history(request):
    requests = OutpassRequest.objects.all().select_related('student').order_by('-start_date', '-start_time')
    
    history_data = []
    for req in requests:
        history_data.append({
            'id': req.id,
            'scholar_id': req.student.scholar_id,
            'student_name': req.student.student_name,
            'course': req.student.course,
            'semester': req.student.semester,
            'start_date': req.start_date.strftime('%d/%m/%Y'),
            'start_time': req.start_time.strftime('%I:%M %p'),
            'end_date': req.end_date.strftime('%d/%m/%Y'),
            'end_time': req.end_time.strftime('%I:%M %p'),
            'purpose': req.purpose,
            'destination': req.destination,
            'status': req.status,
            'reason': req.reason
        })
        
    return JsonResponse({
        'success': True,
        'history': history_data
    })
