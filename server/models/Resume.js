
import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            index: true
        },

        originalName: {
            type: String,
            required: true,
            maxlength: 255
        },

        storedName: {
            type: String,
            required: true,
            unique: true
        },

        storagePath: {
            type: String,
            required: true
        },

        mimeType: {
            type: String,
            default: "application/pdf"
        },

        size: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: ["UPLOADED", "PROCESSING", "COMPLETED", "FAILED"],
            default: "UPLOADED",
            index: true
        },

        aiResumeId: {
            type: String,
            default: null
        },

        pageCount: {
            type: Number,
            default: 0
        },

        indexedChunks: {
            type: Number,
            default: 0
        },

        analysis: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        errorMessage: {
            type: String,
            default: null
        },

        reanalyzingAt: {
            type: Date,
            default: null
        },

        lastReanalysisKey: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

resumeSchema.index({ firebaseUid: 1, createdAt: -1 });

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
