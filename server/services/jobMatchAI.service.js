
import env from "../config/env.js";

export const requestJobMatch = async ({ firebaseUid, payload }) => {
    const response = await fetch(
        `${env.aiServiceUrl}/api/v1/job-matching/match`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Internal-API-Key": env.aiServiceApiKey,
                "X-User-ID": firebaseUid
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(120000)
        }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(
            result?.detail || "AI job matching service failed."
        );

        error.statusCode = response.status === 404 ? 404 : 502;
        throw error;
    }

    return result;
};
