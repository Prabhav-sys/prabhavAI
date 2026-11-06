import test from "node:test";
import assert from "node:assert/strict";

import {
    calculateInterviewCharge,
    getCreditPricing
} from "../services/credit.service.js";

test("credit package catalog uses the confirmed INR prices", () => {
    const packages = getCreditPricing().packages;
    assert.deepEqual(
        packages.map(({ id, credits, priceInr }) => ({ id, credits, priceInr })),
        [
            { id: "starter", credits: 500, priceInr: 249 },
            { id: "pro", credits: 1200, priceInr: 499 },
            { id: "power", credits: 3500, priceInr: 999 }
        ]
    );
});

test("full interview pricing is listed alongside existing interview options", () => {
    assert.equal(getCreditPricing().features.interview.full, 100);
});

test("full interview early-end charges are prorated by elapsed time", () => {
    const getChargeAtMinutes = (minutes, answeredCount = 1) =>
        calculateInterviewCharge({
            reservedCredits: 100,
            answeredCount,
            questionCount: 80,
            fullInterview: true,
            elapsedMs: minutes * 60 * 1000,
            maxDurationMs: 40 * 60 * 1000
        });

    assert.equal(getChargeAtMinutes(0, 0), 0);
    assert.equal(getChargeAtMinutes(24), 60);
    assert.equal(getChargeAtMinutes(28), 70);
    assert.equal(getChargeAtMinutes(50), 100);
});
