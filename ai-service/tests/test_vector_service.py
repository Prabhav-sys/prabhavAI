from types import SimpleNamespace

from app.services import vector_service


class FakeQdrantClient:
    def __init__(self):
        self.payload_schema = {}
        self.created_indexes = []

    def get_collections(self):
        return SimpleNamespace(
            collections=[SimpleNamespace(name=vector_service.settings.qdrant_collection)]
        )

    def get_collection(self, collection_name):
        assert collection_name == vector_service.settings.qdrant_collection
        return SimpleNamespace(payload_schema=self.payload_schema)

    def create_payload_index(self, **kwargs):
        self.created_indexes.append(kwargs)
        self.payload_schema[kwargs["field_name"]] = kwargs["field_schema"]


def test_ensure_collection_creates_filter_indexes_for_existing_collection(monkeypatch):
    client = FakeQdrantClient()
    vector_service.ensure_collection.cache_clear()
    monkeypatch.setattr(vector_service, "get_qdrant_client", lambda: client)

    vector_service.ensure_collection()

    assert {index["field_name"] for index in client.created_indexes} == {
        "user_id",
        "resume_id",
    }
    assert all(
        index["field_schema"] == vector_service.models.PayloadSchemaType.KEYWORD
        for index in client.created_indexes
    )

    vector_service.ensure_collection()
    assert len(client.created_indexes) == 2
    vector_service.ensure_collection.cache_clear()
