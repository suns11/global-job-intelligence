
from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("auth/register/", views.register_view, name="register"),
    path("auth/login/", views.login_view, name="login"),
    path("profile/", views.profile_view, name="profile"),
    path("jobs/analyze/", views.analyze_job_view, name="analyze-job"),
    path("jobs/", views.jobs_view, name="jobs"),
    path("applications/", views.applications_view, name="applications"),
    path("skills/gap/", views.skill_gap_view, name="skill-gap"),
]
