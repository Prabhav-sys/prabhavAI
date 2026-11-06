
import fs from "fs/promises";
import env from "../config/env.js";
import AppError from "../utils/AppError.js";

const AI_TIMEOUT_MS = 120000;

export const analyzeResumeWithAI = async ({
    filePath,
    firebaseUid,
    resumeId
}) => {
    const fileBuffer = await fs.readFile(filePath);

    // Validate the PDF file signature.
    if (!fileBuffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
        throw new Error("Invalid PDF file signature.");
    }

    const formData = new FormData();

    formData.append(
        "file",
        new Blob([fileBuffer], { type: "application/pdf" }),
        "resume.pdf"
    );

    formData.append("resume_id", resumeId);

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        AI_TIMEOUT_MS
    );

    try {
        const response = await fetch(
            `${env.aiServiceUrl}/api/v1/resumes/analyze`,
            {
                method: "POST",

                headers: {
                    "X-Internal-API-Key": env.aiServiceApiKey,
                    "X-User-ID": firebaseUid
                },

                body: formData,
                signal: controller.signal
            }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                result?.detail || "AI resume analysis failed."
            );
        }

        return result;

    } finally {
        clearTimeout(timeout);
    }
};

export const searchResumeContext = async ({
    firebaseUid,
    resumeId,
    query
}) => {
    let response;

    try {
        response = await fetch(
            `${env.aiServiceUrl}/api/v1/resumes/search`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Internal-API-Key": env.aiServiceApiKey,
                    "X-User-ID": firebaseUid
                },
                body: JSON.stringify({
                    query,
                    resume_id: resumeId,
                    limit: 8
                }),
                signal: AbortSignal.timeout(30000)
            }
        );
    } catch (error) {
        const serviceError = new AppError(
            "AI resume search service is unavailable.",
            502
        );
        serviceError.cause = error;
        throw serviceError;
    }

    const results = await response.json().catch(() => null);

    if (
        !response.ok ||
        !Array.isArray(results) ||
        results.some((result) => typeof result?.text !== "string")
    ) {
        throw new AppError(
            "Could not retrieve resume context for the interview.",
            502
        );
    }

    return results.map((result) => result.text);
};

// Delete resume vector index from AI service.
export const deleteResumeIndex = async ({
    firebaseUid,
    resumeId
}) => {
    const response = await fetch(
        `${env.aiServiceUrl}/api/v1/resumes/${encodeURIComponent(resumeId)}`,
        {
            method: "DELETE",
            headers: {
                "X-Internal-API-Key": env.aiServiceApiKey,
                "X-User-ID": firebaseUid
            },
            signal: AbortSignal.timeout(30000)
        }
    );

    if (!response.ok) {
        throw new Error("Could not delete the resume vector index.");
    }

    return response.json();
};
