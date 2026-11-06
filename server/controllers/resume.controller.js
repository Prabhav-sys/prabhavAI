
import fs from "fs/promises";
import {
    processResume,
    reanalyzeResume,
    getMyResumes,
    getMyResume,
    deleteMyResume
} from "../services/resume.service.js";

export const reanalyzeResumeController = async (req, res, next) => {
    const idempotencyKey = req.get("Idempotency-Key");
    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
        return res.status(400).json({
            success: false,
            message: "A valid Idempotency-Key header is required."
        });
    }

    try {
        const resume = await reanalyzeResume({
            resumeId: req.params.resumeId,
            firebaseUid: req.auth.uid,
            idempotencyKey
        });
        return res.status(200).json({
            success: true,
            message: "Resume re-analyzed successfully.",
            data: resume
        });
    } catch (error) {
        next(error);
    }
};

export const uploadResumeController = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF resume."
            });
        }

        const idempotencyKey = req.get("Idempotency-Key");
        if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
            await fs.unlink(req.file.path).catch(() => {});
            return res.status(400).json({
                success: false,
                message: "A valid Idempotency-Key header is required."
            });
        }

        const result = await processResume({
            file: req.file,
            firebaseUid: req.auth.uid,
            idempotencyKey
        });

        return res.status(201).json({
            success: true,
            message: "Resume analyzed successfully.",
            data: result
        });

    } catch (error) {
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }

        next(error);
    }
};

export const listResumesController = async (req, res, next) => {
    try {
        const resumes = await getMyResumes(req.auth.uid);

        return res.status(200).json({
            success: true,
            data: resumes
        });
    } catch (error) {
        next(error);
    }
};

export const getResumeController = async (req, res, next) => {
    try {
        const resume = await getMyResume({
            resumeId: req.params.resumeId,
            firebaseUid: req.auth.uid
        });

        return res.status(200).json({
            success: true,
            data: resume
        });
    } catch (error) {
        next(error);
    }
};

export const deleteResumeController = async (req, res, next) => {
    try {
        await deleteMyResume({
            resumeId: req.params.resumeId,
            firebaseUid: req.auth.uid
        });

        return res.status(200).json({
            success: true,
            message: "Resume deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};
