
import fs from "fs/promises";
import Resume from "../models/Resume.js";
import { analyzeResumeWithAI } from "./aiService.service.js";
import { NotFoundError } from "../utils/errors.js";

export const processResume = async ({ file, firebaseUid }) => {
    const resume = await Resume.create({
        firebaseUid,
        originalName: file.originalname,
        storedName: file.filename,
        storagePath: file.path,
        size: file.size,
        status: "PROCESSING"
    });

    try {
        const result = await analyzeResumeWithAI({
            filePath: file.path,
            firebaseUid,
            resumeId: resume._id.toString()
        });

        resume.status = "COMPLETED";
        resume.aiResumeId = result.resume_id;
        resume.pageCount = result.page_count;
        resume.indexedChunks = result.indexed_chunks;
        resume.analysis = result.analysis;
        resume.errorMessage = null;

        await resume.save();

        return resume;

    } catch (error) {
        resume.status = "FAILED";
        resume.errorMessage = "Resume analysis failed.";

        await resume.save();

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
