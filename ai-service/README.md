# prabhavAI AI Service

FastAPI microservice for resume intelligence, semantic retrieval, AI interview question generation, and optional web research.

## Architecture

- Node/Express remains the public application backend and identity/authorization boundary.
- This service is an internal service. Every `/api/v1/*` endpoint except liveness/readiness requires `X-Internal-API-Key`.
- Groq provides LLM inference (`openai/gpt-oss-120b` by default).
- PyMuPDF extracts PDF text; FastEmbed creates 384-dimensional embeddings.
- Qdrant stores resume text chunks and metadata for semantic retrieval.
- Tavily provides optional web research.
- Weaviate is an optional adapter only; it is not enabled by default. Do not run two vector stores for the same data without a deliberate migration/replication requirement.
- MongoDB remains owned by the Node backend. This service does not create users, modify credits, or persist canonical user/resume records.

## Requirements

- Python 3.12 recommended (supported range: 3.11–3.13)
- `uv`
- Groq API key, Qdrant Cloud API key; Tavily is optional

## Local setup (PowerShell)

```powershell
cd ai-service
uv sync --all-groups
Copy-Item .env.example .env
```

Edit `.env` and add rotated credentials. Generate the internal key:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Set that value as `INTERNAL_API_KEY` in this service and in the Node backend's server-side environment as `AI_SERVICE_INTERNAL_API_KEY`. Set `AI_SERVICE_URL=http://127.0.0.1:8001` in Node.

Start the service:

```powershell
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Docs: http://127.0.0.1:8001/docs
Liveness: http://127.0.0.1:8001/api/v1/health/live
Readiness: http://127.0.0.1:8001/api/v1/health/ready

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/v1/health/live` | Liveness (no auth) |
| GET | `/api/v1/health/ready` | Config/dependency readiness (no auth) |
| POST | `/api/v1/resumes/analyze` | Upload PDF, extract, embed, index, analyze |
| POST | `/api/v1/resumes/search` | Semantic search over a user's indexed resume chunks |
| DELETE | `/api/v1/resumes/{resume_id}` | Delete indexed chunks for a user/resume |
| POST | `/api/v1/interviews/questions` | Generate structured interview questions |
| POST | `/api/v1/research/search` | Tavily search + optional LLM synthesis |

All protected endpoints require `X-Internal-API-Key` and `X-User-ID`. The Node backend must verify Firebase identity and ownership before forwarding the authenticated user's ID. Never expose this service directly to browsers.

## Important integration contract

`POST /resumes/analyze` returns structured analysis and a generated `resume_id` if one was not supplied. The Node backend should persist the resume metadata, status, analysis and ownership in MongoDB. This service indexes chunks in Qdrant using `user_id` and `resume_id` payload fields. Deletion must be coordinated by Node when a resume is deleted.

## Tests and quality

```powershell
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

Tests mock external providers. A passing test suite does not prove that live provider credentials or cloud networking are configured.

## Security notes

- Never commit `.env`, provider keys, uploaded PDFs, or extracted private resume text.
- Rotate credentials that have been pasted into chats, logs, screenshots, or source control.
- Use least-privilege Qdrant API keys and TLS.
- Keep this service on a private network in production; use a high-entropy internal key as an additional control.
- Do not log prompts, resume contents, API keys, authorization headers, or personal data.
- Add request-level rate limits, quotas, queueing and malware scanning before production-scale public uploads.
