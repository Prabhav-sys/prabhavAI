"""Optional Weaviate connectivity adapter. Qdrant remains the default vector store."""
from app.core.config import settings


def check_weaviate_ready() -> bool:
    if not settings.weaviate_enabled:
        return False
    try:
        import weaviate
        from weaviate.classes.init import Auth
    except ImportError as exc:
        raise RuntimeError("Install optional dependency: uv sync --extra weaviate") from exc
    client = weaviate.connect_to_weaviate_cloud(
        cluster_url=settings.weaviate_url,
        auth_credentials=Auth.api_key(settings.weaviate_api_key.get_secret_value()),
    )
    try:
        return bool(client.is_ready())
    finally:
        client.close()
