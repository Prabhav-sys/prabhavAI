import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponse.js";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    handler: (req, res) => {
        return sendError(res, {
            statusCode: 429,
            message: "Too many requests. Please try again later."
        });
    }
});