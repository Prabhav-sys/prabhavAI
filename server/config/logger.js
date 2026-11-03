import pino from "pino";
import env from "./env.js";

const logger = pino({
    level: env.nodeEnv === "production" ? "info" : "debug",

    transport: env.nodeEnv === "production"
        ? undefined
        : {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname"
            }
        },

    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "password",
            "passwordHash",
            "firebaseToken",
            "accessToken",
            "refreshToken",
            "apiKey",
            "secret"
        ],
        censor: "[REDACTED]"
    }
});

export default logger;