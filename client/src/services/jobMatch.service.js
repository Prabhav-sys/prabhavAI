
import api from "./api";

export const createJobMatch = async (payload) => {
    const response = await api.post(
        "/job-matching/match",
        payload,
        { timeout: 180000 }
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
