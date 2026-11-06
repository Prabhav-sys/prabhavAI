import api from "./api";

const createIdempotencyKey = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const getPaymentPackages = async () => {
    const response = await api.get("/payments/packages");
    return response.data.data;
};

export const createPaymentOrder = async (packageId) => {
    const response = await api.post(
        "/payments/orders",
        { packageId },
        { headers: { "Idempotency-Key": createIdempotencyKey() } }
    );
    return response.data.data;
};

export const verifyPayment = async (paymentDetails) => {
    const response = await api.post("/payments/verify", paymentDetails);
    return response.data.data;
};

export const getPaymentHistory = async () => {
    const response = await api.get("/payments");
    return response.data.data;
};
