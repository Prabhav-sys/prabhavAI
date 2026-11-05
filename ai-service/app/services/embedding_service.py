from functools import lru_cache
from fastembed import TextEmbedding
from app.core.config import settings


@lru_cache(maxsize=1)
def get_embedding_model() -> TextEmbedding:
    return TextEmbedding(model_name=settings.embedding_model)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    vectors = list(get_embedding_model().embed(texts))
    return [vector.tolist() for vector in vectors]
