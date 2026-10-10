
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import UserProfile, JobPosting, Application

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "headline",
            "summary",
            "skills",
            "education",
            "experience",
            "projects",
            "languages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Skills must be a list of strings."
            )
        if not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError(
                "Every skill must be text."
            )
        return value


class AnalyzeJobSerializer(serializers.Serializer):
    job_title = serializers.CharField(max_length=240)
    company = serializers.CharField(
        max_length=240, required=False, allow_blank=True, default=""
    )
    job_url = serializers.URLField(
        required=False, allow_blank=True, default=""
    )
    country = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
    job_description = serializers.CharField(
        min_length=30, max_length=30000
    )


class JobPostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosting
        fields = [
            "id", "title", "company", "job_url",
            "job_description", "country", "analysis_json",
            "source_verification_status", "created_at",
        ]
        read_only_fields = [
            "id", "analysis_json",
            "source_verification_status", "created_at",
        ]


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ["id", "job", "status", "deadline", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]
