import json
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMNotConfigured(RuntimeError):
    pass


class LLMService:
    def __init__(self):
        self._client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if not settings.groq_api_key:
            raise LLMNotConfigured("GROQ_API_KEY is not configured")
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=settings.groq_api_key.get_secret_value(),
                base_url=settings.groq_base_url,
                timeout=settings.groq_timeout_seconds,
                max_retries=2,
            )
        return self._client

    async def complete_json(self, *, system: str, user: str, schema: dict, max_tokens: int = 3000) -> dict:
        client = self._get_client()
        response = await client.chat.completions.create(
            model=settings.groq_model,
            temperature=0.2,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system + " Return only valid JSON matching this schema: " + json.dumps(schema)},
                {"role": "user", "content": user},
            ],
        )
        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("LLM returned an empty response")
        return json.loads(content)


llm_service = LLMService()
