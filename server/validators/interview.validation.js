import { z } from "zod";

export const generateInterviewQuestionsSchema = z.object({
    role: z.string().trim().min(2).max(120),
    experience: z.enum(["Fresher", "Junior", "Mid-level", "Senior"]),
    type: z.enum(["Technical", "Behavioral", "HR", "Mixed"]),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    questionCount: z.number().int().min(1).max(20),
    resumeId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    jobMatchId: z.string().regex(/^[a-f\d]{24}$/i).optional()
}).strict();

export const startInterviewSessionSchema = generateInterviewQuestionsSchema.extend({
    resumeId: z.string().regex(/^[a-f\d]{24}$/i),
    questionCount: z.number().int().min(5).max(20),
    fullInterview: z.boolean().default(false)
}).strict().superRefine((config, context) => {
    if (![5, 10, 20].includes(config.questionCount)) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Choose a supported interview length."
        });
    }
});

export const submitInterviewAnswerSchema = z.object({
    answer: z.string().trim().min(1).max(5000)
}).strict();
