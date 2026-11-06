from functools import lru_cache
from uuid import uuid5, NAMESPACE_URL
from qdrant_client import QdrantClient, models
from app.core.config import settings
from app.services.embedding_service import embed_texts


class VectorNotConfigured(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
    if not settings.qdrant_url or not settings.qdrant_api_key:
        raise VectorNotConfigured("QDRANT_URL and QDRANT_API_KEY are required")
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key.get_secret_value(), timeout=20)


@lru_cache(maxsize=1)
def ensure_collection() -> None:
    client = get_qdrant_client()
    names = {item.name for item in client.get_collections().collections}
    if settings.qdrant_collection not in names:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=models.VectorParams(size=settings.embedding_dimension, distance=models.Distance.COSINE),
        )

    payload_schema = client.get_collection(settings.qdrant_collection).payload_schema or {}
    for field_name in ("user_id", "resume_id"):
        if field_name not in payload_schema:
            client.create_payload_index(
                collection_name=settings.qdrant_collection,
                field_name=field_name,
                field_schema=models.PayloadSchemaType.KEYWORD,
                wait=True,
            )


def index_chunks(*, user_id: str, resume_id: str, chunks: list[str]) -> int:
    if not chunks:
        return 0
    ensure_collection()
    vectors = embed_texts(chunks)
    points = []
    for index, (chunk, vector) in enumerate(zip(chunks, vectors, strict=True)):
        point_id = str(uuid5(NAMESPACE_URL, f"{user_id}:{resume_id}:{index}"))
        points.append(models.PointStruct(id=point_id, vector=vector, payload={
            "user_id": user_id, "resume_id": resume_id, "chunk_index": index, "text": chunk,
        }))
    get_qdrant_client().upsert(collection_name=settings.qdrant_collection, points=points, wait=True)
    return len(points)


def search_chunks(*, user_id: str, query: str, limit: int, resume_id: str | None = None):
    ensure_collection()
    vector = embed_texts([query])[0]
    conditions = [models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id))]
    if resume_id:
        conditions.append(models.FieldCondition(key="resume_id", match=models.MatchValue(value=resume_id)))
    result = get_qdrant_client().query_points(
        collection_name=settings.qdrant_collection,
        query=vector,
        query_filter=models.Filter(must=conditions),
        limit=limit,
        with_payload=True,
    )
    return result.points


def delete_resume_chunks(*, user_id: str, resume_id: str) -> None:
    client = get_qdrant_client()
    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=models.FilterSelector(filter=models.Filter(must=[
            models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)),
            models.FieldCondition(key="resume_id", match=models.MatchValue(value=resume_id)),
        ])),
        wait=True,
    )
