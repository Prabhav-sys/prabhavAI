
import api from "./api";

export const syncUserWithBackend = async () => {
    const response = await api.post("/auth/sync");

    return response.data.data.user;
};

export const getMyProfile = async () => {
    const response = await api.get("/auth/me");

    return response.data.data.user;
};

export const updateMyProfile = async (profileData) => {
    const response = await api.patch(
        "/profile/me",
        profileData
    );

    return response.data.data.user;
};
