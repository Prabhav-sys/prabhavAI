from pydantic import BaseModel, Field


class ResearchRequest(BaseModel):
    query: str = Field(min_length=3, max_length=500)
    include_answer: bool = True
    max_results: int = Field(default=5, ge=1, le=10)


class ResearchSource(BaseModel):
    title: str
    url: str
    content: str
    score: float | None = None


class ResearchResponse(BaseModel):
    query: str
    answer: str | None = None
    sources: list[ResearchSource]
