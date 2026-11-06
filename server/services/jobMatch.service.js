
import mongoose from "mongoose";
import JobMatch from "../models/JobMatch.js";
import Resume from "../models/Resume.js";
import { requestJobMatch } from "./jobMatchAI.service.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import {
    refundReservation,
    reserveCredits,
    settleReservation
} from "./credit.service.js";
import { createHash, randomUUID } from "crypto";

export const createJobMatch = async ({
    firebaseUid,
    payload,
    jobDescriptionPdf,
    idempotencyKey = randomUUID()
}) => {
    if (!mongoose.isValidObjectId(payload.resumeId)) {
        throw new BadRequestError("Invalid resume ID.");
    }

    const resume = await Resume.findOne({
        _id: payload.resumeId,
        firebaseUid
    }).select("_id aiResumeId status");

    if (!resume) {
        throw new NotFoundError("Resume not found.");
    }

    if (resume.status !== "COMPLETED" || !resume.aiResumeId) {
        throw new BadRequestError(
            "Resume must be successfully analyzed before job matching."
        );
    }

    const referenceId = new mongoose.Types.ObjectId().toString();
    const reservationKey = createHash("sha256")
        .update(`${firebaseUid}:JOB_MATCH:${idempotencyKey}`)
        .digest("hex");
    const reservation = await reserveCredits({
        firebaseUid,
        amount: 15,
        feature: "JOB_MATCH",
        referenceId,
        idempotencyKey: reservationKey
    });

    try {
        const result = await requestJobMatch({
            firebaseUid,
            jobDescriptionPdf,
            payload: {
                resume_id: resume.aiResumeId,
                job_title: payload.jobTitle,
                company: payload.company || null,
                ...(payload.jobDescription ? { job_description: payload.jobDescription } : {})
            }
        });

        const match = await JobMatch.create({
            _id: referenceId,
            firebaseUid,
            resumeId: resume._id,
            jobTitle: result.job_title,
            company: result.company,
            jobDescription: result.job_description,
            matchScore: result.match_score,
            requiredCoverage: result.required_coverage,
            preferredCoverage: result.preferred_coverage,
            analysis: {
                overallAssessment: result.analysis.overall_assessment,
                requirements: result.analysis.requirements.map(item => ({
                    requirement: item.requirement,
                    category: item.category,
                    importance: item.importance,
                    status: item.status,
                    evidence: item.evidence,
                    resumeChunk: item.resume_chunk
                })),
                strengths: result.analysis.strengths,
                gaps: result.analysis.gaps,
                recommendations: result.analysis.recommendations,
                caveats: result.analysis.caveats
            }
        });
        await settleReservation({
            reservationId: reservation._id,
            capturedCredits: 15,
            description: "Job description match completed"
        });
        return match;
    } catch (error) {
        await refundReservation({
            reservationId: reservation._id,
            description: "Job match failed; reserved credits refunded"
        });
        throw error;
    }
};

export const getMyJobMatches = async ({ firebaseUid, limit = 20 }) => {
    return JobMatch.find({ firebaseUid })
        .select("-jobDescription")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

export const getMyJobMatch = async ({ firebaseUid, matchId }) => {
    if (!mongoose.isValidObjectId(matchId)) {
        throw new BadRequestError("Invalid match ID.");
    }

    const match = await JobMatch.findOne({
        _id: matchId,
        firebaseUid
    }).lean();

    if (!match) {
        throw new NotFoundError("Job match report not found.");
    }

    return match;
};
