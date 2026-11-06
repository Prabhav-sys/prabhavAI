import api from "./api";
import { auth } from "../firebase/firebase";

const getLegacyHistoryKey = () => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
        throw new Error("Sign in to load interview history.");
    }

    return `prabhavai:interview-history:${userId}`;
};

export const generateInterviewQuestions = async (config) => {
    const { resumeId, ...interviewConfig } = config;
    const payload = resumeId
        ? { ...interviewConfig, resumeId }
        : interviewConfig;
    const response = await api.post("/interviews/questions", payload, {
        timeout: 180000
    });

    return response.data.data;
};

export const startInterviewSession = async (config) => {
    const { resumeId, ...interviewConfig } = config;
    const payload = resumeId ? { ...interviewConfig, resumeId } : interviewConfig;
    const response = await api.post("/interviews/sessions", payload, {
        timeout: 180000,
        headers: { "Idempotency-Key": window.crypto.randomUUID() }
    });
    return response.data.data;
};

export const submitInterviewAnswer = async (sessionId, answer) => {
    const response = await api.post(
        `/interviews/sessions/${sessionId}/answer`,
        { answer },
        { timeout: 180000 }
    );
    return response.data.data;
};

export const abandonInterviewSession = async (sessionId) => {
    const response = await api.post(`/interviews/sessions/${sessionId}/abandon`);
    return response.data.data;
};

export const getInterviewHistory = async () => {
    const response = await api.get("/interviews/sessions");
    const history = response.data.data;

    if (!Array.isArray(history)) {
        throw new Error("Interview history has an invalid format.");
    }

    const legacy = window.localStorage.getItem(getLegacyHistoryKey());
    const legacyHistory = legacy ? JSON.parse(legacy) : [];
    if (!Array.isArray(legacyHistory)) {
        throw new Error("Saved interview history has an invalid format.");
    }

    return [...history, ...legacyHistory]
        .sort((first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        )
        .slice(0, 20);
};
