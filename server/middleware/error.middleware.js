export const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Duplicate key error
    if (err.code === 11000) {
        return sendError(res, {
            statusCode: 409,
            message: "Resource already exists"
        });
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
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

    return sendError(res, {
        statusCode: 500,
        message: "Internal server error"
    });
};