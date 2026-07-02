from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('super-admin/', views.superadmin_dashboard, name='superadmin_dashboard'),
    path('gatekeeper/', views.gatekeeper_dashboard, name='gatekeeper_dashboard'),
    path('login/', views.login_view, name='login'),
    path('api/student/create/', views.api_create_student, name='api_create_student'),
    path('api/student/update/', views.api_update_student, name='api_update_student'),
    path('api/student/delete/', views.api_delete_student, name='api_delete_student'),
    path('api/student/<str:scholar_id>/', views.student_lookup, name='student_lookup'),
    path('api/student/<str:scholar_id>/history/', views.student_history, name='student_history'),
    path('api/request/create/', views.create_request, name='create_request'),
    path('api/request/update_status/', views.update_status, name='update_status'),
    path('students/', views.students_view, name='students'),
    path('history/', views.history_view, name='history'),
    path('api/history/', views.api_all_history, name='api_all_history'),
    path('logout/', views.logout_view, name='logout'),
]
