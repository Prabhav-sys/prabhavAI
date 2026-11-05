from app.core.config import settings


def chunk_text(text: str) -> list[str]:
    normalized = " ".join(text.split())
    if not normalized:
        return []
    chunks = []
    start = 0
    while start < len(normalized):
        end = min(start + settings.chunk_size, len(normalized))
        if end < len(normalized):
            boundary = normalized.rfind(" ", start, end)
            if boundary > start + settings.chunk_size // 2:
                end = boundary
        chunks.append(normalized[start:end].strip())
        if end >= len(normalized):
            break
        start = max(end - settings.chunk_overlap, start + 1)
    return [chunk for chunk in chunks if chunk]
