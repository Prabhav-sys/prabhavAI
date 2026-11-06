import api from "./api";

export const getDashboardSummary = async () => {
    const response = await api.get("/dashboard/summary");
    return response.data.data;
};

export const getAdminDashboard = async () => {
    const response = await api.get("/admin/dashboard");
    return response.data.data;
};

export const getAdminUsers = async ({ page = 1, limit = 10, search = "" } = {}) => {
    const response = await api.get("/users", {
        params: { page, limit, search, sortBy: "createdAt", order: "desc" }
    });
    return {
        users: response.data.data,
        meta: response.data.meta
    };
};
