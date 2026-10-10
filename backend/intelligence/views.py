
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view, permission_classes, authentication_classes
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .analysis_service import analyze_job
from .models import UserProfile, JobPosting, Application
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    AnalyzeJobSerializer,
    JobPostingSerializer,
    ApplicationSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "service": "job-intelligence-api"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token = Token.objects.create(user=user)
    return Response(
        {"token": token.key, "username": user.username},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def login_view(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")

    if not isinstance(username, str) or not isinstance(password, str):
        return Response(
            {"detail": "Username and password must be text."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request, username=username, password=password
    )
    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "username": user.username})


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(UserProfileSerializer(profile).data)

    partial = request.method == "PATCH"
    serializer = UserProfileSerializer(
        profile, data=request.data, partial=partial
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def analyze_job_view(request):
    serializer = AnalyzeJobSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    result = analyze_job(
        data["job_title"],
        data["company"],
        data["country"],
        data["job_description"],
    )
    return Response(result)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def jobs_view(request):
    if request.method == "GET":
        jobs = JobPosting.objects.order_by("-created_at")[:100]
        return Response(JobPostingSerializer(jobs, many=True).data)

    serializer = JobPostingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    obj = serializer.save()
    return Response(
        JobPostingSerializer(obj).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def applications_view(request):
    if request.method == "GET":
        items = Application.objects.filter(
            user=request.user
        ).select_related("job").order_by("-created_at")[:100]
        return Response(ApplicationSerializer(items, many=True).data)

    serializer = ApplicationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    obj = serializer.save(user=request.user)
    return Response(
        ApplicationSerializer(obj).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def skill_gap_view(request):
    profile = UserProfile.objects.filter(user=request.user).first()
    if not profile:
        return Response(
            {"detail": "Save your profile before comparing skills."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    required = request.data.get("required_skills", [])
    if (
        not isinstance(required, list)
        or not all(isinstance(item, str) for item in required)
    ):
        return Response(
            {"detail": "required_skills must be a list of strings."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def normalize(items):
        return {
            item.strip().casefold(): item.strip()
            for item in items
            if isinstance(item, str) and item.strip()
        }

    candidate = normalize(profile.skills)
    job = normalize(required)

    matched = [job[key] for key in job if key in candidate]
    missing = [job[key] for key in job if key not in candidate]
    percentage = round(len(matched) / len(job) * 100, 1) if job else 0.0

    return Response({
        "matched_skills": matched,
        "missing_skills": missing,
        "required_skill_count": len(job),
        "matched_skill_count": len(matched),
        "match_percentage": percentage,
        "note": "This percentage compares listed skills only; it is not a hiring probability.",
    })
