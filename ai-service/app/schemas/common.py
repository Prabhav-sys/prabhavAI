from pydantic import BaseModel, ConfigDict


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    service: str
    environment: str
