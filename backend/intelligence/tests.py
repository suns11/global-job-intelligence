from django.test import TestCase
from rest_framework.test import APIClient

class ApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
    def test_health(self):
        r = self.client.get("/api/health/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "ok")
    def test_analyze_fallback_and_unverified_label(self):
        r = self.client.post("/api/jobs/analyze/", {
            "job_title": "Junior Data Analyst", "company": "Example", "country": "Bangladesh",
            "job_description": "Use Python and SQL for data analysis. Bachelor's degree preferred."
        }, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("python", r.data["required_skills"])
        self.assertEqual(r.data["source_verification"]["status"], "not_verified")
    def test_short_description_rejected(self):
        r = self.client.post("/api/jobs/analyze/", {"job_title": "Analyst", "job_description": "Short"}, format="json")
        self.assertEqual(r.status_code, 400)
