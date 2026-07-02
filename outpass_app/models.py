from django.db import models
from django.utils import timezone

class Student(models.Model):
    scholar_id = models.CharField(max_length=20, primary_key=True)
    student_name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=15)
    course = models.CharField(max_length=100)
    semester = models.IntegerField()
    hostel_name = models.CharField(max_length=100)
    room_number = models.CharField(max_length=20)
    purpose = models.CharField(max_length=200, default='', blank=True)
    destination = models.CharField(max_length=200, default='', blank=True)

    def __str__(self):
        return f"{self.student_name} ({self.scholar_id})"

class OutpassRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='outpass_requests')
    purpose = models.CharField(max_length=200, default='')
    destination = models.CharField(max_length=200, default='')
    start_date = models.DateField(default=timezone.now)
    start_time = models.TimeField()
    end_date = models.DateField(default=timezone.now)
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    reason = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Outpass Request - {self.student.scholar_id} from {self.start_date} to {self.end_date}"
