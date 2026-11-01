
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { sendError } from "./utils/apiResponse.js";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.json());


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

// User routes
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
    return sendError(res, {
        statusCode: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
