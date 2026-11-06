
import {
    createJobMatch,
    getMyJobMatches,
    getMyJobMatch
} from "../services/jobMatch.service.js";

import { createJobMatchSchema } from "../validators/jobMatch.validation.js";
import { z } from "zod";

const createJobMatchPdfSchema = z.object({
    resumeId: z.string().min(1).max(128),
    jobTitle: z.string().trim().min(2).max(160),
    company: z.string().trim().max(160).optional()
}).strict();

export const createJobMatchController = async (req, res, next) => {
    try {
        const hasPdf = Boolean(req.file);
        const parsed = (hasPdf ? createJobMatchPdfSchema : createJobMatchSchema)
            .safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: hasPdf
                    ? "Select a resume, enter the role title, and upload a valid job-description PDF."
                    : "Invalid job matching request.",
                errors: parsed.error.issues
            });
        }

        if (hasPdf && !req.file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
            return res.status(400).json({
                success: false,
                message: "The uploaded job description is not a valid PDF."
            });
        }

        const idempotencyKey = req.get("Idempotency-Key");
        if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
            return res.status(400).json({
                success: false,
                message: "A valid Idempotency-Key header is required."
            });
        }

        // Pass validated data to service.
        const result = await createJobMatch({
            firebaseUid: req.auth.uid,
            payload: parsed.data,
            jobDescriptionPdf: req.file || null,
            idempotencyKey
        });

        return res.status(201).json({
            success: true,
            message: "Job match generated successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};


export const listJobMatchesController = async (req, res, next) => {
    try {
        const matches = await getMyJobMatches({
            firebaseUid: req.auth.uid
        });

        return res.status(200).json({
            success: true,
            data: matches
        });
    } catch (error) {
        next(error);
    }
};


export const getJobMatchController = async (req, res, next) => {
    try {
        const match = await getMyJobMatch({
            firebaseUid: req.auth.uid,
            matchId: req.params.matchId
        });

        return res.status(200).json({
            success: true,
            data: match
        });
    } catch (error) {
        next(error);
    }
};
