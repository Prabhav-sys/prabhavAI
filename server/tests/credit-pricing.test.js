import test from "node:test";
import assert from "node:assert/strict";

import { getCreditPricing } from "../services/credit.service.js";

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
