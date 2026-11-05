
import { z } from "zod";

export const createJobMatchSchema = z.object({
    resumeId: z.string().min(1).max(128),
    jobTitle: z.string().trim().min(2).max(160),
    company: z.string().trim().max(160).optional().nullable(),
    jobDescription: z.string().trim().min(100).max(20000)
}).strict();
