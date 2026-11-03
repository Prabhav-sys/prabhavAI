
import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import logger from "./config/logger.js";
import mongoose from "mongoose";

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(env.port, () => {
            logger.info(
                {
                    port: env.port,
                    environment: env.nodeEnv
                },
                "Server started"
            );
        });

        let isShuttingDown = false;

        const shutdown = async (signal) => {
            if (isShuttingDown) return;

            isShuttingDown = true;

            logger.info(`${signal} received. Shutting down...`);

            server.close(async (error) => {
                if (error) {
                    logger.error(
                        { err: error },
                        "HTTP server shutdown failed"
                    );

                    process.exitCode = 1;
                }

                try {
                    await mongoose.disconnect();

                    logger.info("MongoDB disconnected");

                    logger.info("Application shutdown complete");

                } catch (dbError) {
                    logger.error(
                        { err: dbError },
                        "Database shutdown failed"
                    );

                    process.exitCode = 1;
                }
            });
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

    } catch (error) {
        logger.fatal(
            { err: error },
            "Server startup failed"
        );

        process.exit(1);
    }
};

startServer();
