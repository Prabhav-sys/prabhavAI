from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class ResumeAnalysis(BaseModel):
    model_config = ConfigDict(extra="forbid")
    summary: str = Field(description="Concise professional summary grounded only in the resume")
    skills: list[str] = Field(default_factory=list, max_length=80)
    experience_years_estimate: float | None = Field(default=None, ge=0, le=60)
    seniority: Literal["intern", "junior", "mid", "senior", "lead", "unknown"] = "unknown"
    strengths: list[str] = Field(default_factory=list, max_length=12)
    improvement_areas: list[str] = Field(default_factory=list, max_length=12)
    missing_sections: list[str] = Field(default_factory=list, max_length=12)
    project_highlights: list[str] = Field(default_factory=list, max_length=12)
    ats_readability_score: int = Field(ge=0, le=100)
    recommendations: list[str] = Field(default_factory=list, max_length=12)


class ResumeAnalysisResponse(BaseModel):
    resume_id: str
    page_count: int
    extracted_characters: int
    indexed_chunks: int
    analysis: ResumeAnalysis
    warnings: list[str] = Field(default_factory=list)


class ResumeSearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000)
    resume_id: str | None = None
    limit: int = Field(default=5, ge=1, le=20)


class ResumeSearchHit(BaseModel):
    chunk_id: str
    resume_id: str
    text: str
    score: float
    page: int | None = None
