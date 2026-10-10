# Global Job Application Intelligence Platform — MVP

Starter architecture: Next.js + TypeScript, Django REST Framework, PostgreSQL, optional OpenAI-compatible AI API.

## Run locally with Docker
1. Install Docker Desktop.
2. Copy `.env.example` to `.env`.
3. Run `docker compose up --build`.
4. Open http://localhost:3000 and API health at http://localhost:8000/api/health/.

The backend container runs migrations at startup. Without an AI key, the job analyzer uses a conservative keyword fallback. Add `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` to `.env` to use an OpenAI-compatible chat-completions endpoint; provider quotas and endpoint details must be checked with the provider.

## Run without Docker
Backend: `cd backend`, create/activate a Python venv, `pip install -r requirements.txt`, `python manage.py makemigrations intelligence`, `python manage.py migrate`, `python manage.py runserver`.
Frontend: in another terminal, `cd frontend`, `npm install`, `npm run dev`.

## API
- `GET /api/health/`
- `POST /api/jobs/analyze/` with JSON: `{"job_title":"Junior Analyst","company":"Example","country":"Bangladesh","job_description":"Python and SQL skills required. Bachelor's degree preferred."}`
- `GET/POST /api/jobs/`
- `GET/POST /api/applications/`

## Current limits
This is a development MVP, not a production-ready public multi-user service. It does not yet implement signup/login, per-user object permissions, official-source fetching, URL ingestion, CV/cover-letter generation, PDF/DOCX export, billing, or external application submission. The job analyzer labels source verification `not_verified` and eligibility `unknown` unless later functionality supplies evidence.

## Before public/commercial launch
Implement and test authentication and per-user authorization, rate limiting, secure deployment settings, HTTPS, managed secrets, backups, monitoring, privacy/retention/deletion/export workflows, safe URL fetching with SSRF protections, upload scanning and limits, source provenance, human review, accessibility and load tests. Require explicit user approval before any external submission. Never bypass CAPTCHA or platform controls.
