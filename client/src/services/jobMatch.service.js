
import api from "./api";

export const createJobMatch = async ({ resumeId, jobTitle, company, jobDescriptionPdf }) => {
    const formData = new FormData();
    formData.append("resumeId", resumeId);
    formData.append("jobTitle", jobTitle);
    if (company) formData.append("company", company);
    formData.append("jobDescriptionPdf", jobDescriptionPdf);

    const response = await api.post(
        "/job-matching/match",
        formData,
        {
            timeout: 180000,
            headers: {
                "Content-Type": "multipart/form-data",
                "Idempotency-Key": window.crypto.randomUUID()
            }
        }
    );

    return response.data.data;
};

export const getJobMatches = async () => {
    const response = await api.get("/job-matching");
    return response.data.data;
};

export const getJobMatch = async (matchId) => {
    const response = await api.get(`/job-matching/${matchId}`);
    return response.data.data;
};
