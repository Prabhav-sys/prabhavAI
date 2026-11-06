import api from "./api";

export const getCreditWallet = async () => {
    const response = await api.get("/credits/wallet");
    return response.data.data;
};

export const getCreditPricing = async () => {
    const response = await api.get("/credits/pricing");
    return response.data.data;
};
