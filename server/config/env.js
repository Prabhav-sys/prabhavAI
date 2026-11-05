
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce.number()
        .int()
        .min(1)
        .max(65535)
        .default(5000),

    MONGODB_URI: z.string()
        .min(1, "MONGODB_URI is required"),

    CLIENT_URL: z.string()
        .url("CLIENT_URL must be a valid URL")
        .default("http://localhost:5173"),

    // Firebase configuration
    FIREBASE_PROJECT_ID: z.string()
        .min(1, "FIREBASE_PROJECT_ID is required"),

    GOOGLE_APPLICATION_CREDENTIALS: z.string()
        .min(1, "GOOGLE_APPLICATION_CREDENTIALS is required"),

    // AI Service configuration
    AI_SERVICE_URL: z.string()
        .url()
        .default("http://127.0.0.1:8001"),

    AI_SERVICE_API_KEY: z.string()
        .min(32, "AI_SERVICE_API_KEY must be at least 32 characters"),

    MAX_RESUME_SIZE_MB: z.coerce.number()
        .int()
        .min(1)
        .max(20)
        .default(5)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment configuration:");

    console.error(
        parsedEnv.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
        }))
    );

    process.exit(1);
}

const env = parsedEnv.data;

export default {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    mongodbUri: env.MONGODB_URI,
    clientUrl: env.CLIENT_URL,

    // Firebase configuration
    firebaseProjectId: env.FIREBASE_PROJECT_ID,
    googleApplicationCredentials: env.GOOGLE_APPLICATION_CREDENTIALS,

    // AI Service configuration
    aiServiceUrl: env.AI_SERVICE_URL,
    aiServiceApiKey: env.AI_SERVICE_API_KEY,
    maxResumeSizeMb: env.MAX_RESUME_SIZE_MB
};
