
import fs from "fs/promises";
import env from "../config/env.js";

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
