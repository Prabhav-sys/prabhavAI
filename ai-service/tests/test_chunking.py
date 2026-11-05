from app.services.chunking_service import chunk_text


def test_chunking_empty_text():
    assert chunk_text("   ") == []


def test_chunking_preserves_content():
    text = "Python developer with machine learning experience. " * 100
    chunks = chunk_text(text)
    assert len(chunks) > 1
    assert all(chunks)
    assert all(len(chunk) <= 1200 for chunk in chunks)
