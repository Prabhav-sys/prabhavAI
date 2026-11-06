
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

    CLIENT_URLS: z.string()
        .default("")
        .transform((value) => value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)),

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

    RAZORPAY_MODE: z.enum(["test", "live"])
        .default("test"),

    RAZORPAY_KEY_ID: z.string()
        .default(""),

    RAZORPAY_KEY_SECRET: z.string()
        .default(""),

    RAZORPAY_WEBHOOK_SECRET: z.string()
        .default(""),

    MAX_RESUME_SIZE_MB: z.coerce.number()
        .int()
        .min(1)
        .max(20)
        .default(5)
}).superRefine((config, context) => {
    const hasKeyId = config.RAZORPAY_KEY_ID.length > 0;
    const hasKeySecret = config.RAZORPAY_KEY_SECRET.length > 0;

    if (hasKeyId !== hasKeySecret) {
        context.addIssue({
            code: "custom",
            path: ["RAZORPAY_KEY_SECRET"],
            message: "Razorpay key ID and secret must be configured together"
        });
    }

    if (hasKeyId) {
        const expectedPrefix = config.RAZORPAY_MODE === "test" ? "rzp_test_" : "rzp_live_";
        if (!config.RAZORPAY_KEY_ID.startsWith(expectedPrefix)) {
            context.addIssue({
                code: "custom",
                path: ["RAZORPAY_KEY_ID"],
                message: `RAZORPAY_KEY_ID must use the ${config.RAZORPAY_MODE} key prefix`
            });
        }
    }
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
    clientUrls: env.CLIENT_URLS.length > 0
        ? env.CLIENT_URLS
        : [env.CLIENT_URL],

    // Firebase configuration
    firebaseProjectId: env.FIREBASE_PROJECT_ID,
    googleApplicationCredentials: env.GOOGLE_APPLICATION_CREDENTIALS,

    // AI Service configuration
    aiServiceUrl: env.AI_SERVICE_URL,
    aiServiceApiKey: env.AI_SERVICE_API_KEY,
    razorpayMode: env.RAZORPAY_MODE,
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    maxResumeSizeMb: env.MAX_RESUME_SIZE_MB
};
