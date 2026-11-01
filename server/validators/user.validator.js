import { z } from "zod";

// CREATE USER
export const createUserSchema = z.object({
    firebaseUid: z.string().trim().min(1, "Firebase UID is required"),

    name: z.string()
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(80, "Name cannot exceed 80 characters"),

    email: z.string()
        .trim()
        .email("Invalid email address")
        .toLowerCase()
}).strict();


// UPDATE USER
export const updateUserSchema = z.object({
    name: z.string()
        .trim()
        .min(2)
        .max(80)
        .optional(),

    email: z.string()
        .trim()
        .email("Invalid email address")
        .toLowerCase()
        .optional(),

    avatarUrl: z.string()
        .trim()
        .url("Invalid avatar URL")
        .or(z.literal(""))
        .optional()
})
.strict()
.refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required for update" }
);


// PAGINATION QUERY
export const paginationSchema = z.object({
    page: z.coerce.number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce.number()
        .int()
        .min(1)
        .max(100)
        .default(10)
}).strict();