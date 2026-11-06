import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
    {
        lotId: { type: mongoose.Schema.Types.ObjectId, required: true },
        credits: { type: Number, required: true, min: 1 }
    },
    { _id: false }
);

const creditReservationSchema = new mongoose.Schema(
    {
        firebaseUid: { type: String, required: true },
        feature: { type: String, required: true },
        referenceId: { type: String, required: true },
        idempotencyKey: { type: String, required: true, unique: true },
        amount: { type: Number, required: true, min: 1 },
        capturedCredits: { type: Number, default: 0, min: 0 },
        allocations: { type: [allocationSchema], required: true },
        status: {
            type: String,
            enum: ["RESERVED", "CAPTURED", "PARTIAL", "REFUNDED"],
            default: "RESERVED",
            index: true
        },
        expiresAt: { type: Date, required: true }
    },
    { timestamps: true }
);

creditReservationSchema.index({ firebaseUid: 1, referenceId: 1 }, { unique: true });

const CreditReservation = mongoose.model(
    "CreditReservation",
    creditReservationSchema
);

export default CreditReservation;
