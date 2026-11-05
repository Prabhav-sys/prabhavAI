
import {
    createJobMatch,
    getMyJobMatches,
    getMyJobMatch
} from "../services/jobMatch.service.js";

import { createJobMatchSchema } from "../validators/jobMatch.validation.js";


export const createJobMatchController = async (req, res, next) => {
    try {
        // Validate request body.
        const parsed = createJobMatchSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid job matching request.",
                errors: parsed.error.issues
            });
        }

        // Pass validated data to service.
        const result = await createJobMatch({
            firebaseUid: req.auth.uid,
            payload: parsed.data
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
