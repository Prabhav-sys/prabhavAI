
import { z } from "zod";

// CREATE USER
export const createUserSchema = z.object({
    firebaseUid: z.string().trim().min(1),
    name: z.string().trim().min(1).max(100),
    email: z.string().email().toLowerCase()
}).strict();

// UPDATE USER
export const updateUserSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().email().toLowerCase().optional(),
    avatarUrl: z.string().optional()
})
.strict()
.refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required" }
);

// GET ALL USERS
export const userQuerySchema = z.object({
    page: z.coerce.number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce.number()
        .int()
        .min(1)
        .max(100)
        .default(10),

    role: z.enum(["USER", "ADMIN"]).optional(),

    sortBy: z.enum([
        "createdAt",
        "name",
        "email"
    ]).default("createdAt"),

    order: z.enum(["asc", "desc"]).default("desc"),

    search: z.string()
        .trim()
        .max(100)
        .optional()
}).strict();
