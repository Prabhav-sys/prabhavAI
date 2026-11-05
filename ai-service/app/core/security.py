
import hmac

from fastapi import Header, HTTPException, status
from app.core.config import settings


def require_internal_key(
    x_internal_api_key: str | None = Header(
        default=None,
        alias="X-Internal-API-Key"
    )
) -> None:
    expected = (
        settings.internal_api_key.get_secret_value()
        if settings.internal_api_key
        else None
    )

    if (
        not expected
        or not x_internal_api_key
        or not hmac.compare_digest(expected, x_internal_api_key)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service credentials"
        )


def require_user_id(
    x_user_id: str | None = Header(
        default=None,
        alias="X-User-ID"
    )
) -> str:
    if not x_user_id or not x_user_id.strip() or len(x_user_id) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User-ID header is required"
        )

    return x_user_id.strip()
