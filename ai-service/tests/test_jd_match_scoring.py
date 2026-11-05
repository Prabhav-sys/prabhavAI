from app.schemas.jd_match import RequirementEvidence


def test_requirement_schema_accepts_evidence_statuses():
    item = RequirementEvidence(
        requirement="Python experience",
        category="skill",
        importance="required",
        status="partial",
        evidence="Used Python in an academic project.",
    )
    assert item.status == "partial"
    assert item.importance == "required"
