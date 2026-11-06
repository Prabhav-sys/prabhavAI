import test from "node:test";
import assert from "node:assert/strict";

import { startInterviewSessionSchema } from "../validators/interview.validation.js";

const validPayload = {
    role: "Software Engineer",
    experience: "Mid-level",
    type: "Technical",
    difficulty: "Medium",
    questionCount: 5,
    resumeId: "507f1f77bcf86cd799439011"
};

test("interview session accepts only supported paid interview lengths", () => {
    for (const questionCount of [5, 10, 20]) {
        assert.equal(
            startInterviewSessionSchema.safeParse({
                ...validPayload,
                questionCount
            }).success,
            true
        );
    }

    for (const questionCount of [2, 7, 21]) {
        assert.equal(
            startInterviewSessionSchema.safeParse({
                ...validPayload,
                questionCount
            }).success,
            false
        );
    }
});

test("interview session requires resume context and rejects unknown properties", () => {
    const withoutResume = { ...validPayload };
    delete withoutResume.resumeId;
    assert.equal(startInterviewSessionSchema.safeParse(withoutResume).success, false);

    assert.equal(
        startInterviewSessionSchema.safeParse({
            ...validPayload,
            unexpected: true
        }).success,
        false
    );
});
