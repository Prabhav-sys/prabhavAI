
import hmac

from fastapi import Header, HTTPException, status

from app.core.config import settings


async def verify_internal_request(
    x_internal_api_key: str = Header(..., alias="X-Internal-API-Key"),
    x_user_id: str = Header(..., alias="X-User-ID"),
) -> str:
    configured_key = settings.internal_api_key

    if configured_key is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal API authentication is not configured.",
        )

    expected_key = configured_key.get_secret_value()

    if not hmac.compare_digest(x_internal_api_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key.",
        )

    if not x_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID is required.",
        )

    return x_user_id
