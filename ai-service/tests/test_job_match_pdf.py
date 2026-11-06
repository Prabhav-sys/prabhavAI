import pytest
from types import SimpleNamespace
from app.api.routes import job_matching
from app.core.config import settings
from app.schemas.jd_match import (
    JobDescriptionMatchAnalysis,
    JobDescriptionMatchResponse,
    RequirementEvidence,
)
from app.schemas.jd_match import JobDescriptionMatchRequest
from app.services import jd_match_service

PDF_DESCRIPTION = (
    "Senior Backend Engineer. " * 8
    + "Requirements include Python, distributed systems, and cloud infrastructure. "
    "Responsibilities include architecture, reliability, and technical mentorship."
)


@pytest.mark.asyncio
async def test_job_match_pdf_extracts_text_and_returns_recommendations(client, monkeypatch):
    async def fake_extract(upload):
        assert upload.filename == "role.pdf"
        assert upload.content_type == "application/pdf"
        return PDF_DESCRIPTION, 1, []

    async def fake_match(*, user_id, request):
        assert user_id == "test-user"
        assert request.job_description == PDF_DESCRIPTION
        assert request.job_title == "Senior Backend Engineer"
        return JobDescriptionMatchResponse(
            resume_id=request.resume_id,
            job_title=request.job_title,
            company=request.company,
            job_description=request.job_description,
            match_score=75,
            required_coverage=75,
            preferred_coverage=75,
            analysis=JobDescriptionMatchAnalysis(
                overall_assessment="Relevant evidence for the role.",
                requirements=[
                    RequirementEvidence(
                        requirement="Python experience",
                        category="skill",
                        status="matched",
                        evidence="Python project experience is present.",
                    )
                ],
                recommendations=["Add verified outcomes to the relevant project bullet."],
            ),
        )

    monkeypatch.setattr(job_matching, "read_and_extract_pdf", fake_extract)
    monkeypatch.setattr(job_matching, "match_resume_to_job", fake_match)
    response = client.post(
        "/api/v1/job-matching/match-pdf",
        headers={
            "X-Internal-API-Key": settings.internal_api_key.get_secret_value(),
            "X-User-ID": "test-user",
        },
        data={
            "resume_id": "resume-test-id",
            "job_title": "Senior Backend Engineer",
            "company": "Example",
        },
        files={
            "job_description_pdf": ("role.pdf", b"%PDF-test", "application/pdf")
        },
    )

    assert response.status_code == 200
    assert response.json()["job_description"] == PDF_DESCRIPTION
    assert response.json()["analysis"]["recommendations"]


@pytest.mark.asyncio
async def test_job_match_report_and_score_follow_selected_resume_and_job(monkeypatch):
    prompts = []

    def fake_search_chunks(*, user_id, query, limit, resume_id):
        assert user_id == "test-user"
        assert resume_id == "selected-resume"
        assert limit == 12
        return [
            SimpleNamespace(
                score=0.9,
                payload={"text": "Built production services using Python and PostgreSQL."},
            )
        ]

    async def fake_complete_json(*, system, user, schema, max_tokens):
        prompts.append(user)
        requirement = "Python backend development" if "Python opening" in user else "Rust compiler design"
        status = "matched" if requirement.startswith("Python") else "not_found"
        return {
            "overall_assessment": f"Evidence review for {requirement}.",
            "requirements": [
                {
                    "requirement": requirement,
                    "category": "skill",
                    "importance": "required",
                    "status": status,
                    "evidence": "Python services are described in the resume." if status == "matched" else "",
                }
            ],
            "strengths": [],
            "gaps": [],
            "recommendations": [f"Review evidence relevant to {requirement}."],
            "caveats": [],
        }

    monkeypatch.setattr(jd_match_service, "search_chunks", fake_search_chunks)
    monkeypatch.setattr(jd_match_service.llm_service, "complete_json", fake_complete_json)

    reports = []
    for description in (
        "Python opening. " + "Backend services and data ownership. " * 4,
        "Rust opening. " + "Compiler architecture and optimization. " * 4,
    ):
        reports.append(
            await jd_match_service.match_resume_to_job(
                user_id="test-user",
                request=JobDescriptionMatchRequest(
                    resume_id="selected-resume",
                    job_title="Software Engineer",
                    job_description=description,
                ),
            )
        )

    assert reports[0].match_score == 100
    assert reports[1].match_score == 0
    assert reports[0].analysis.requirements[0].requirement != reports[1].analysis.requirements[0].requirement
    assert reports[0].job_description != reports[1].job_description
    assert "Python opening" in prompts[0]
    assert "Rust opening" in prompts[1]
    assert "Built production services using Python" in prompts[0]


def test_job_match_returns_not_found_only_when_resume_evidence_is_missing(client, monkeypatch):
    monkeypatch.setattr(jd_match_service, "search_chunks", lambda **kwargs: [])
    headers = {
        "X-Internal-API-Key": settings.internal_api_key.get_secret_value(),
        "X-User-ID": "test-user",
    }
    request = {
        "resume_id": "resume-test-id",
        "job_title": "Backend Engineer",
        "job_description": "Backend role. " + "Build and operate reliable services. " * 4,
    }

    missing_resume = client.post(
        "/api/v1/job-matching/match",
        headers=headers,
        json=request,
    )
    assert missing_resume.status_code == 404

    def broken_search(**kwargs):
        raise ValueError("Vector provider rejected this query.")

    monkeypatch.setattr(jd_match_service, "search_chunks", broken_search)
    provider_error = client.post(
        "/api/v1/job-matching/match",
        headers=headers,
        json=request,
    )
    assert provider_error.status_code == 502
