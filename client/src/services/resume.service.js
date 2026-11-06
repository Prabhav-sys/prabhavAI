
import api from "./api";

export const uploadResume = async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await api.post(
        "/resumes/upload",
        formData,
        {
            timeout: 180000,
            headers: {
                "Content-Type": "multipart/form-data",
                "Idempotency-Key": window.crypto.randomUUID()
            },
            onUploadProgress
        }
    );

    return response.data.data;
};

export const getMyResumes = async () => {
    const response = await api.get("/resumes");
    return response.data.data;
};

export const getResume = async (resumeId) => {
    const response = await api.get(`/resumes/${resumeId}`);
    return response.data.data;
};

export const reanalyzeResume = async (resumeId) => {
    const response = await api.post(
        `/resumes/${resumeId}/reanalyze`,
        {},
        {
            timeout: 180000,
            headers: { "Idempotency-Key": window.crypto.randomUUID() }
        }
    );
    return response.data.data;
};

export const deleteResume = async (resumeId) => {
    const response = await api.delete(`/resumes/${resumeId}`);
    return response.data;
};
