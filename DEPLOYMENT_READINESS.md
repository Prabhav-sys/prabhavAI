# prabhavAI Deployment Readiness

## Release status

**Not production-ready yet.** The application has working product flows and local verification, but release still depends on Firebase domain configuration, authenticated end-to-end testing, Razorpay merchant setup, and production deployment/security checks. Do not treat a successful local build as production sign-off.

## Issues found and addressed

- **Job Fit and interview resume search failed:** the configured Qdrant collection had no keyword payload indexes for `user_id` or `resume_id`. Qdrant rejected filtered searches, which surfaced as a Job Fit 502 and prevented reliable retrieval for interviews. The AI service now creates the missing indexes on its first collection check; indexes have been created and a filtered search smoke test passed.
- **Job Fit errors were misclassified:** any Python `ValueError`, including provider/JSON errors, could be reported as “resume not found.” Only a typed missing-resume-evidence error now maps to 404; unexpected provider failures remain 502 and are logged without logging resume/JD content.
- **Interview AI error handling:** the Node resume-search client referenced `AppError` without importing it, masking upstream errors. The import is fixed and covered by a test.
- **Old Job Fit result could remain visible after changing inputs:** changing the selected resume, title, company, or PDF now clears the displayed report. A newly submitted analysis also clears the previous result, and saved reports show when they were generated.
- **Static-looking scores:** the fit score is derived from the current AI-classified requirements and evidence. A matched requirement earns full weight, a partial match half, and a missing requirement zero; required requirements carry four times the weight of preferred requirements. With no requirements of one category, that category no longer silently contributes a perfect score. Each report is a saved snapshot; changing the resume or job requires running a new analysis.
- **Local sign-in failed on `127.0.0.1`:** Firebase returned `auth/unauthorized-domain` for that host. Use `http://localhost:5173` for local development, or explicitly authorize the exact hostname in Firebase Authentication settings.

## Twelve-phase review

| Phase | Current state | Release note |
|---|---|---|
| 1 — Foundation | Implemented | React/Vite, Express, MongoDB, and API connectivity are present. |
| 2 — Backend architecture | Implemented | Routes, controllers, services, models, and centralized middleware are present. |
| 3 — Authentication | Implemented; environment-dependent | Firebase Google sign-in and protected APIs are present. Confirm local and production authorized domains. |
| 4 — Frontend | Implemented | Responsive application pages and shared components are present. Verify target browsers and accessibility before release. |
| 5 — Resume processing | Implemented; verify operational limits | Private PDF upload, extraction, analysis, and resume indexing are present. Test malformed, scanned, oversized, and deletion cases. |
| 6 — AI integration | Implemented; provider-dependent | Groq structured output and resume retrieval power analysis, job fit, and interview questions. The configured LLM provider passed a non-user smoke test; monitor quotas, latency, and model availability. |
| 7 — Mock interview | Implemented; end-to-end sign-off pending | Sessions, adaptive turns, evaluation, reports, credit settlement, and turn-based browser voice are present. This is not a continuous full-duplex audio stream. Run a signed-in interview from setup through report. |
| 8 — Credits | Implemented; database integration sign-off pending | Mongo transactions, reservations, refunds, usage history, and package catalog are present. Validate under the production MongoDB replica-set configuration. |
| 9 — Razorpay | Code implemented; checkout disabled until configured | Test/live API keys and webhook secret are absent locally. Complete a sandbox order, checkout, verification, webhook, and duplicate-event test before enabling purchases. |
| 10 — Dashboard | Implemented; data validation pending | User/admin analytics read persisted account and activity data. Verify metrics against real records and test admin access controls. |
| 11 — Advanced engineering | Partially complete | Rate limits, validation, security headers, logging, ownership checks, and indexes exist. Formal security testing, database-backed billing tests, operational monitoring, and load testing remain release gates. |
| 12 — Deployment | Not complete | Docker/Compose and environment templates exist, but no production hosting, domain, credentials, or public deployment smoke test is configured. |

## Release checklist

### Local functional verification

- [x] AI-service unit tests cover PDF matching, changing report inputs, required/preferred score weighting, and the 20-question limit.
- [x] Qdrant `user_id` and `resume_id` keyword indexes are present; filtered retrieval smoke test succeeds.
- [x] Backend tests cover interview validation, prices, and translation of AI resume-search failures.
- [x] Frontend production build succeeds.
- [ ] Sign in at `http://localhost:5173` using the intended Firebase account.
- [ ] As that account, analyze a real resume, run Job Fit with two different text-based job-description PDFs, and verify both reports reflect their own requirements and resume evidence.
- [ ] Start an interview from its setup screen, answer turns, finish it, and verify the saved report, history, and wallet balance.
- [ ] Test scanned/empty-text, invalid-signature, and over-limit PDFs; verify errors are clear and failed operations do not consume credits.
- [ ] Complete Razorpay sandbox checkout, backend signature verification, webhook delivery, duplicate-webhook handling, and credit addition.

### Production configuration and operations

- [ ] Configure production Firebase authorized domains and Google sign-in redirect/origin settings.
- [ ] Provision production MongoDB Atlas with TLS, least-privilege credentials, backups, and the replica-set transaction support the wallet requires.
- [ ] Provision Qdrant with the required keyword payload indexes (`user_id`, `resume_id`) and confirm the production AI service can filter by both.
- [ ] Configure the production LLM, embeddings, vector database, internal API key, Firebase service account, and service URLs through a secret manager. Never commit secrets or expose server secrets to Vite/client variables.
- [ ] Configure Razorpay Test Mode first. For live mode, finish merchant KYC and bank verification, add live API keys only to the backend secret store, configure the HTTPS webhook URL at `/api/v1/payments/webhook`, and subscribe to `payment.captured` and `order.paid`.
- [ ] Verify settlement timing and account details in Razorpay; funds settle through Razorpay’s merchant settlement process.
- [ ] Set production CORS allow-list to the exact HTTPS frontend origin; disable development defaults.
- [ ] Deploy frontend, Node API, and AI service; keep the AI service private and internal-key protected.
- [ ] Set health checks, structured-log redaction, alerting, rate limits, file-size limits, retention/deletion policy, and incident/rollback procedures.
- [ ] Run dependency/security scans, authorization/ownership tests, payment idempotency tests, and load tests against a staging environment.
- [ ] Perform a production smoke test for sign-in, resume upload and deletion, fresh Job Fit report, interview completion, wallet accounting, payment verification, and admin authorization.

## Local run and verification

Run the services from their respective directories:

```powershell
# client
npm run dev -- --host localhost

# server
npm run dev

# ai-service
uv run --python 3.12 uvicorn app.main:app --host 127.0.0.1 --port 8001
```

The local frontend should be opened at `http://localhost:5173` so the Firebase origin matches the configured development flow. Service health endpoints are `http://localhost:5000/api/health` and `http://127.0.0.1:8001/api/v1/health/ready`.

Run checks:

```powershell
# client
npm run build
npm run lint

# server
npm test

# ai-service
uv run --python 3.12 --group dev python -m pytest
```

## Important product and payment limits

- Job Fit accepts a selectable-text PDF, up to 5 MB. Scanned/image-only PDFs need OCR support before they can be analyzed.
- Job-fit percentages are evidence-weighted indicators, not a probability of receiving an interview or offer.
- Interview audio is turn-based browser speech playback/transcription; uploaded audio is not currently a continuous streaming interview.
- Razorpay code alone cannot enable real charges or bank settlement. Merchant activation, verified bank details, live credentials, HTTPS webhook setup, and a successful staged verification are required.
