
import env from "../config/env.js";
import AppError from "../utils/AppError.js";

export const requestJobMatch = async ({ firebaseUid, payload, jobDescriptionPdf }) => {
    const headers = {
        "X-Internal-API-Key": env.aiServiceApiKey,
        "X-User-ID": firebaseUid
    };
    let body;
    let endpoint = "match";

    if (jobDescriptionPdf) {
        endpoint = "match-pdf";
        const formData = new FormData();
        formData.append("resume_id", payload.resume_id);
        formData.append("job_title", payload.job_title);
        if (payload.company) formData.append("company", payload.company);
        formData.append(
            "job_description_pdf",
            new Blob([new Uint8Array(jobDescriptionPdf.buffer)], { type: "application/pdf" }),
            jobDescriptionPdf.originalname
        );
        body = formData;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
    }

    let response;
    try {
        response = await fetch(
            `${env.aiServiceUrl}/api/v1/job-matching/${endpoint}`,
            {
                method: "POST",
                headers,
                body,
                signal: AbortSignal.timeout(120000)
            }
        );
    } catch (cause) {
        const error = new Error("AI job matching service is unavailable.", { cause });
        error.statusCode = 502;
        throw error;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        const statusCode = response.status >= 400 && response.status < 500
            ? response.status
            : 502;
        const message = typeof result?.detail === "string"
            ? result.detail
            : "AI job matching service failed.";
        throw new AppError(message, statusCode);
    }

    return result;
};
