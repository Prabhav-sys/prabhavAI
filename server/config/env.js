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
        .default("http://localhost:5173")
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
    clientUrl: env.CLIENT_URL
};