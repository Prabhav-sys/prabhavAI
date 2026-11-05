from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class InterviewQuestionRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    experience_level: Literal["intern", "entry", "junior", "mid", "senior", "lead"] = "entry"
    interview_type: Literal["technical", "behavioral", "mixed", "system_design"] = "mixed"
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed"
    question_count: int = Field(default=5, ge=1, le=15)
    resume_context: str | None = Field(default=None, max_length=12000)


class InterviewQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str
    category: str
    difficulty: Literal["easy", "medium", "hard"]
    what_it_assesses: str
    evaluation_criteria: list[str] = Field(default_factory=list, max_length=6)
    suggested_follow_up: str | None = None


class InterviewQuestionResponse(BaseModel):
    role: str
    questions: list[InterviewQuestion]
