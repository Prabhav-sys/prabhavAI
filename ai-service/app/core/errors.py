from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(request: Request, exc: StarletteHTTPException):
        return ORJSONResponse(status_code=exc.status_code, content={"error": {"code": "http_error", "message": exc.detail}})

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        from app.core.logging import get_logger
        get_logger(__name__).exception("Unhandled request error", error_type=type(exc).__name__)
        return ORJSONResponse(status_code=500, content={"error": {"code": "internal_error", "message": "An unexpected error occurred"}})
