
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import env from "./config/env.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { sendError } from "./utils/apiResponse.js";
import apiV1Routes from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import requestLogger from "./middleware/requestLogger.middleware.js";

const app = express();

// CORS Configuration
const corsOptions = {
    origin: env.clientUrl,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

// 1. Security headers
app.use(helmet());

// 2. CORS
app.use(cors(corsOptions));

app.use(requestLogger);
app.use((req, res, next) => {
    res.setHeader("X-Request-ID", req.id);
    next();
});


// 3. Request parsing
app.use(express.json({
    limit: "10kb"
}));

// Express 5 compatibility for express-mongo-sanitize
app.use((req, res, next) => {
    Object.defineProperty(req, "query", {
        value: { ...req.query },
        writable: true,
        configurable: true,
        enumerable: true
    });

    next();
});

// 4. NoSQL sanitization
app.use(
    mongoSanitize({
        replaceWith: "_"
    })
);


// 5. Health checks and documentation

// Swagger documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "InterviewAI backend is running!"
    });
});

// Database health check
app.get("/api/db-check", async (req, res, next) => {
    try {
        await mongoose.connection.db.admin().ping();

        res.status(200).json({
            success: true,
            database: "connected"
        });

    } catch (error) {
        next(error);
    }
});

// 6. Versioned API with rate limiting
app.use("/api/v1", apiLimiter, apiV1Routes);

// 7. 404 handler
app.use((req, res) => {
    return sendError(res, {
        statusCode: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// 8. Global error handler (MUST remain last)
app.use(errorHandler);

export default app;
