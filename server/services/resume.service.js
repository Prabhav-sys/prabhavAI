
import fs from "fs/promises";
import Resume from "../models/Resume.js";
import { analyzeResumeWithAI } from "./aiService.service.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import {
    getFeatureCost,
    refundReservation,
    reserveCredits,
    settleReservation
} from "./credit.service.js";
import { createHash } from "crypto";

export const processResume = async ({ file, firebaseUid, idempotencyKey }) => {
    const resume = await Resume.create({
        firebaseUid,
        originalName: file.originalname,
        storedName: file.filename,
        storagePath: file.path,
        size: file.size,
        status: "PROCESSING"
    });

    const reservationKey = createHash("sha256")
        .update(`${firebaseUid}:RESUME_ANALYSIS:${idempotencyKey}`)
        .digest("hex");
    let reservation;
    try {
        reservation = await reserveCredits({
            firebaseUid,
            amount: getFeatureCost("RESUME_ANALYSIS"),
            feature: "RESUME_ANALYSIS",
            referenceId: resume._id.toString(),
            idempotencyKey: reservationKey
        });
    } catch (error) {
        await resume.deleteOne();
        throw error;
    }

    let result;
    try {
        result = await analyzeResumeWithAI({
            filePath: file.path,
            firebaseUid,
            resumeId: resume._id.toString()
        });
    } catch (error) {
        resume.status = "FAILED";
        resume.errorMessage = "Resume analysis failed.";
        await resume.save();
        await refundReservation({
            reservationId: reservation._id,
            description: "Resume analysis failed; reserved credits refunded"
        });
        throw error;
    }

    try {
        resume.status = "COMPLETED";
        resume.aiResumeId = result.resume_id;
        resume.pageCount = result.page_count;
        resume.indexedChunks = result.indexed_chunks;
        resume.analysis = result.analysis;
        resume.errorMessage = null;

        await resume.save();
        await settleReservation({
            reservationId: reservation._id,
            capturedCredits: getFeatureCost("RESUME_ANALYSIS"),
            description: "Resume analysis completed"
        });
        return resume;
    } catch (error) {
        if (resume.status !== "FAILED") {
            resume.status = "FAILED";
            resume.errorMessage = "Resume analysis could not be saved.";
            await resume.save();
        }
        await refundReservation({
            reservationId: reservation._id,
            description: "Resume analysis failed; reserved credits refunded"
        });
        throw error;
    }
};

export const reanalyzeResume = async ({
    resumeId,
    firebaseUid,
    idempotencyKey
}) => {
    const requestKey = createHash("sha256")
        .update(`${firebaseUid}:RESUME_REANALYSIS:${resumeId}:${idempotencyKey}`)
        .digest("hex");
    const previousResult = await Resume.findOne({
        _id: resumeId,
        firebaseUid,
        lastReanalysisKey: requestKey
    });
    if (previousResult) return previousResult;

    const staleLockBefore = new Date(Date.now() - 3 * 60 * 1000);
    const resume = await Resume.findOneAndUpdate(
        {
            _id: resumeId,
            firebaseUid,
            status: "COMPLETED",
            $or: [
                { reanalyzingAt: null },
                { reanalyzingAt: { $lt: staleLockBefore } }
            ]
        },
        { $set: { reanalyzingAt: new Date() } },
        { new: true }
    );

    if (!resume) {
        const ownedResume = await Resume.exists({ _id: resumeId, firebaseUid });
        if (!ownedResume) throw new NotFoundError("Resume not found.");
        throw new ConflictError("This resume is not ready or is already being re-analyzed.");
    }

    const reservationKey = createHash("sha256")
        .update(`${requestKey}:credit-reservation`)
        .digest("hex");
    let reservation;
    try {
        reservation = await reserveCredits({
            firebaseUid,
            amount: getFeatureCost("RESUME_REANALYSIS"),
            feature: "RESUME_REANALYSIS",
            referenceId: `${resume._id}:reanalysis:${requestKey}`,
            idempotencyKey: reservationKey
        });
    } catch (error) {
        await Resume.updateOne(
            { _id: resume._id, firebaseUid },
            { $set: { reanalyzingAt: null } }
        );
        throw error;
    }

    try {
        const result = await analyzeResumeWithAI({
            filePath: resume.storagePath,
            firebaseUid,
            resumeId: resume.aiResumeId || resume._id.toString()
        });
        resume.aiResumeId = result.resume_id;
        resume.pageCount = result.page_count;
        resume.indexedChunks = result.indexed_chunks;
        resume.analysis = result.analysis;
        resume.errorMessage = null;
        resume.lastReanalysisKey = requestKey;
        resume.reanalyzingAt = null;
        await resume.save();

        await settleReservation({
            reservationId: reservation._id,
            capturedCredits: getFeatureCost("RESUME_REANALYSIS"),
            description: "Resume re-analysis completed"
        });
        return resume;
    } catch (error) {
        await Resume.updateOne(
            { _id: resume._id, firebaseUid },
            { $set: { reanalyzingAt: null } }
        );
        await refundReservation({
            reservationId: reservation._id,
            description: "Resume re-analysis failed; reserved credits refunded"
        });
        throw error;
    }
};

export const getMyResumes = async (firebaseUid) => {
    return Resume.find({ firebaseUid })
        .select("-storagePath")
        .sort({ createdAt: -1 })
        .lean();
};

export const getMyResume = async ({ resumeId, firebaseUid }) => {
    const resume = await Resume.findOne({
        _id: resumeId,
        firebaseUid
    }).select("-storagePath");

    if (!resume) {
        throw new NotFoundError("Resume not found.");
    }

    return resume;
};

export const deleteMyResume = async ({ resumeId, firebaseUid }) => {
    const resume = await Resume.findOne({
        _id: resumeId,
        firebaseUid
    });

    if (!resume) {
        throw new NotFoundError("Resume not found.");
    }

    // Remove the user's vector index before removing the metadata.
    if (resume.aiResumeId) {
        const { deleteResumeIndex } = await import("./aiService.service.js");

        await deleteResumeIndex({
            firebaseUid,
            resumeId: resume.aiResumeId
        });
    }

    await fs.unlink(resume.storagePath).catch(() => {});

    await resume.deleteOne();

    return { deleted: true };
};
