import test from "node:test";
import assert from "node:assert/strict";

import {
    startInterviewSessionSchema,
    submitInterviewAnswerSchema
} from "../validators/interview.validation.js";

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

test("full interview requires the full-session sentinel and accepts the 100-credit format", () => {
    assert.equal(
        startInterviewSessionSchema.safeParse({
            ...validPayload,
            questionCount: 5,
            fullInterview: true
        }).success,
        true
    );
    assert.equal(
        startInterviewSessionSchema.safeParse({
            ...validPayload,
            questionCount: 80,
            fullInterview: true
        }).success,
        false
    );
});

test("interview answer accepts code responses with a supported language", () => {
    assert.equal(
        submitInterviewAnswerSchema.safeParse({
            answer: "print('hello')",
            answerMode: "code",
            codeLanguage: "python"
        }).success,
        true
    );
    assert.equal(
        submitInterviewAnswerSchema.safeParse({
            answer: "print('hello')",
            answerMode: "code",
            codeLanguage: "invalid"
        }).success,
        false
    );
});
