
import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
    {
        requirement: { type: String, required: true },
        category: {
            type: String,
            enum: ["skill", "experience", "education", "responsibility", "tool", "other"],
            default: "other"
        },
        importance: {
            type: String,
            enum: ["required", "preferred"],
            default: "required"
        },
        status: {
            type: String,
            enum: ["matched", "partial", "not_found"],
            required: true
        },
        evidence: { type: String, default: "" },
        resumeChunk: { type: String, default: null }
    },
    { _id: false }
);

const analysisSchema = new mongoose.Schema(
    {
        overallAssessment: { type: String, required: true },
        requirements: { type: [requirementSchema], default: [] },
        strengths: { type: [String], default: [] },
        gaps: { type: [String], default: [] },
        recommendations: { type: [String], default: [] },
        caveats: { type: [String], default: [] }
    },
    { _id: false }
);

const jobMatchSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            index: true
        },
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Resume"
        },
        jobTitle: {
            type: String,
            required: true,
            maxlength: 160
        },
        company: {
            type: String,
            default: null,
            maxlength: 160
        },
        jobDescription: {
            type: String,
            required: true,
            maxlength: 20000
        },
        matchScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        requiredCoverage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        preferredCoverage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        analysis: {
            type: analysisSchema,
            required: true
        }
    },
    { timestamps: true }
);

jobMatchSchema.index({ firebaseUid: 1, createdAt: -1 });
jobMatchSchema.index({ firebaseUid: 1, resumeId: 1, createdAt: -1 });

export default mongoose.model("JobMatch", jobMatchSchema);
