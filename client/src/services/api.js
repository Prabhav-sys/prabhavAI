
import axios from "axios";
import { auth } from "../firebase/firebase";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
    async (config) => {
        const currentUser = auth.currentUser;

        if (currentUser) {
            const token = await currentUser.getIdToken();

            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response) {
            // Backend returned an HTTP error.
            console.error(
                "API Error:",
                error.response.status,
                error.response.data
            );
        } else if (error.request) {
            // Request was sent but no response was received.
            console.error("No response received from server.");
        } else {
            console.error("Request setup error:", error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
