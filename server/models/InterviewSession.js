import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        question: { type: String, required: true, maxlength: 2000 },
        category: { type: String, required: true, maxlength: 80 },
        difficulty: { type: String, required: true },
        whatItAssesses: { type: String, default: "" },
        evaluationCriteria: { type: [String], default: [] }
    },
    { _id: false }
);

const evaluationSchema = new mongoose.Schema(
    {
        score: { type: Number, min: 1, max: 5, required: true },
        feedback: { type: String, required: true, maxlength: 1200 },
        strengths: { type: [String], default: [] },
        improvements: { type: [String], default: [] }
    },
    { _id: false }
);

const turnSchema = new mongoose.Schema(
    {
        question: { type: questionSchema, required: true },
        answer: { type: String, default: null, maxlength: 5000 },
        evaluation: { type: evaluationSchema, default: null },
        answeredAt: { type: Date, default: null }
    },
    { timestamps: true }
);

const reportSchema = new mongoose.Schema(
    {
        overallScore: { type: Number, min: 1, max: 5, required: true },
        summary: { type: String, required: true, maxlength: 2000 },
        strengths: { type: [String], default: [] },
        areasToImprove: { type: [String], default: [] },
        recommendations: { type: [String], default: [] }
    },
    { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
    {
        firebaseUid: { type: String, required: true },
        role: { type: String, required: true, maxlength: 120 },
        experience: { type: String, required: true },
        type: { type: String, required: true },
        difficulty: { type: String, required: true },
        questionCount: { type: Number, required: true, min: 2, max: 20 },
        fullInterview: { type: Boolean, default: false },
        idempotencyKey: { type: String },
        creditReservationId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        reservedCredits: { type: Number, default: 0, min: 0 },
        resumeId: { type: mongoose.Schema.Types.ObjectId, default: null },
        jobMatchId: { type: mongoose.Schema.Types.ObjectId, default: null },
        status: {
            type: String,
            enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED", "FAILED"],
            default: "IN_PROGRESS",
            index: true
        },
        turns: { type: [turnSchema], default: [] },
        report: { type: reportSchema, default: null },
        completedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        optimisticConcurrency: true
    }
);

interviewSessionSchema.index({ firebaseUid: 1, createdAt: -1 });
interviewSessionSchema.index(
    { firebaseUid: 1, idempotencyKey: 1 },
    { unique: true, sparse: true }
);

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

export default InterviewSession;
