
import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(env.mongodbUri);

        logger.info(
            { host: connection.connection.host },
            "MongoDB connected"
        );

        return connection;

    } catch (error) {
        logger.error(
            { err: error },
            "MongoDB connection failed"
        );

        throw error;
    }
};

// MongoDB connection event listeners
mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
    logger.error(
        { err: error },
        "MongoDB connection error"
    );
});

export default connectDB;
