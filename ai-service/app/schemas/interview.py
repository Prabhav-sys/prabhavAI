from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InterviewQuestionRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    experience_level: Literal["intern", "entry", "junior", "mid", "senior", "lead"] = "entry"
    interview_type: Literal["technical", "behavioral", "mixed", "system_design"] = "mixed"
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed"
    question_count: int = Field(default=5, ge=1, le=20)
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


class InterviewSessionStartRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    experience_level: Literal["intern", "entry", "junior", "mid", "senior", "lead"] = "entry"
    interview_type: Literal["technical", "behavioral", "mixed", "system_design"] = "mixed"
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed"
    question_count: int = Field(default=5, ge=2, le=20)
    resume_context: str | None = Field(default=None, max_length=12000)


class InterviewTurn(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    category: str = Field(min_length=1, max_length=80)
    answer: str = Field(min_length=1, max_length=5000)
    previous_score: int | None = Field(default=None, ge=1, le=5)
    previous_feedback: str | None = Field(default=None, max_length=300)


class InterviewEvaluation(BaseModel):
    score: int = Field(ge=1, le=5)
    feedback: str = Field(min_length=1, max_length=1200)
    strengths: list[str] = Field(default_factory=list, max_length=5)
    improvements: list[str] = Field(default_factory=list, max_length=5)


class InterviewReport(BaseModel):
    overall_score: int = Field(ge=1, le=5)
    summary: str = Field(min_length=1, max_length=2000)
    strengths: list[str] = Field(default_factory=list, max_length=8)
    areas_to_improve: list[str] = Field(default_factory=list, max_length=8)
    recommendations: list[str] = Field(default_factory=list, max_length=8)


class InterviewTurnRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    experience_level: Literal["intern", "entry", "junior", "mid", "senior", "lead"]
    interview_type: Literal["technical", "behavioral", "mixed", "system_design"]
    difficulty: Literal["easy", "medium", "hard", "mixed"]
    question_count: int = Field(ge=2, le=20)
    completed_turns: list[InterviewTurn] = Field(default_factory=list, max_length=19)
    current_question: InterviewQuestion
    answer: str = Field(min_length=1, max_length=5000)
    completed_count: int = Field(ge=1, le=20)
    resume_context: str | None = Field(default=None, max_length=12000)


class InterviewTurnResponse(BaseModel):
    evaluation: InterviewEvaluation
    is_complete: bool
    next_question: InterviewQuestion | None = None
    final_report: InterviewReport | None = None
