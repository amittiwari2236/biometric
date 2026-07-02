from outpass_app.models import Student
from django.contrib.auth.models import User

# Create admin
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')

# Create some students
students = [
    {
        'scholar_id': '230101001',
        'student_name': 'Amit Tiwari',
        'mobile_number': '9876543210',
        'course': 'B.Tech CSE',
        'semester': 5,
        'hostel_name': 'Boys Hostel A',
        'room_number': '101'
    },
    {
        'scholar_id': '230101002',
        'student_name': 'Sneha Sharma',
        'mobile_number': '9876543211',
        'course': 'B.Tech ECE',
        'semester': 5,
        'hostel_name': 'Girls Hostel B',
        'room_number': '205'
    }
]

for data in students:
    if not Student.objects.filter(scholar_id=data['scholar_id']).exists():
        Student.objects.create(**data)

print("Seed data successfully added.")
