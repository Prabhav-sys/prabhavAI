import test from "node:test";
import assert from "node:assert/strict";

import { searchResumeContext } from "../services/aiService.service.js";
import AppError from "../utils/AppError.js";

test("resume search reports AI-service failures as an application error", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(
        JSON.stringify({ detail: "Vector search is unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
    );

    try {
        await assert.rejects(
            searchResumeContext({
                firebaseUid: "test-user",
                resumeId: "test-resume",
                query: "interview context"
            }),
            (error) => error instanceof AppError && error.statusCode === 502
        );
    } finally {
        globalThis.fetch = originalFetch;
    }
});
