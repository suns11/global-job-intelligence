from django.conf import settings
from django.db import models

class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class UserProfile(TimestampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_profile")
    headline = models.CharField(max_length=180, blank=True)
    summary = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    projects = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)

class JobPosting(TimestampedModel):
    title = models.CharField(max_length=240)
    company = models.CharField(max_length=240, blank=True)
    job_url = models.URLField(blank=True)
    job_description = models.TextField()
    country = models.CharField(max_length=100, blank=True)
    analysis_json = models.JSONField(default=dict, blank=True)
    source_verification_status = models.CharField(max_length=32, default="not_verified")
    def __str__(self):
        return f"{self.title} — {self.company}" if self.company else self.title

class Application(TimestampedModel):
    STATUS_CHOICES = [(s, s.title()) for s in ["saved", "preparing", "applied", "interview", "offer", "rejected", "withdrawn"]]
    job = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name="applications")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="saved")
    deadline = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

class RequirementRule(TimestampedModel):
    STATUS_CHOICES = [(s, s.replace("_", " ").title()) for s in ["verified", "unverified", "conflicting", "needs_review"]]
    jurisdiction = models.CharField(max_length=120)
    category = models.CharField(max_length=100)
    statement = models.TextField()
    source_title = models.CharField(max_length=240, blank=True)
    source_url = models.URLField(blank=True)
    source_excerpt = models.TextField(blank=True)
    authority_type = models.CharField(max_length=80, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unverified")
    scope_notes = models.TextField(blank=True)
