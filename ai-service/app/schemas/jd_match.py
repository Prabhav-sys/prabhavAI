from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class JobDescriptionMatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resume_id: str = Field(min_length=1, max_length=128)
    job_title: str = Field(min_length=2, max_length=160)
    company: str | None = Field(default=None, max_length=160)
    job_description: str = Field(min_length=100, max_length=20000)


class RequirementEvidence(BaseModel):
    requirement: str = Field(min_length=2, max_length=300)
    category: Literal["skill", "experience", "education", "responsibility", "tool", "other"] = "other"
    importance: Literal["required", "preferred"] = "required"
    status: Literal["matched", "partial", "not_found"]
    evidence: str = Field(default="", max_length=1200)
    resume_chunk: str | None = Field(default=None, max_length=1800)


class JobDescriptionMatchAnalysis(BaseModel):
    model_config = ConfigDict(extra="forbid")
    overall_assessment: str = Field(min_length=10, max_length=2500)
    requirements: list[RequirementEvidence] = Field(min_length=1, max_length=40)
    strengths: list[str] = Field(default_factory=list, max_length=12)
    gaps: list[str] = Field(default_factory=list, max_length=12)
    recommendations: list[str] = Field(default_factory=list, max_length=12)
    caveats: list[str] = Field(default_factory=list, max_length=8)


class JobDescriptionMatchResponse(BaseModel):
    resume_id: str
    job_title: str
    company: str | None = None
    match_score: int = Field(ge=0, le=100)
    required_coverage: int = Field(ge=0, le=100)
    preferred_coverage: int = Field(ge=0, le=100)
    analysis: JobDescriptionMatchAnalysis
