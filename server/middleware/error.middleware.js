
import AppError from "../utils/AppError.js";
import { sendError } from "../utils/apiResponse.js";
import logger from "../config/logger.js";



export const errorHandler = (err, req, res, next) => {
    logger.error(
    {
        err,
        requestId: req.id,
        method: req.method,
        path: req.originalUrl
    },
    "Request failed"
);

    // Duplicate MongoDB key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];

        return sendError(res, {
            statusCode: 409,
            message: field
                ? `${field} already exists`
                : "Resource already exists"
        });
    }

    // Mongoose validation
    if (err.name === "ValidationError" && !err.isOperational) {
        return sendError(res, {
            statusCode: 400,
            message: "Database validation failed",
            errors: Object.values(err.errors).map(error => ({
                field: error.path,
                message: error.message
            }))
        });
    }

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
        return sendError(res, {
            statusCode: 400,
            message: "Invalid resource ID"
        });
    }

    // Known application errors
    if (err instanceof AppError) {
        return sendError(res, {
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors
        });
    }

    // Request payload too large
    if (err.type === "entity.too.large") {
        return sendError(res, {
            statusCode: 413,
            message: "Request payload is too large"
        });
    }

    // Unknown/unexpected errors
    return sendError(res, {
        statusCode: 500,
        message: "Internal server error"
    });
};
