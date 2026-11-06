import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
    {
        lotId: { type: mongoose.Schema.Types.ObjectId, required: true },
        credits: { type: Number, required: true, min: 1 }
    },
    { _id: false }
);

const creditTransactionSchema = new mongoose.Schema(
    {
        firebaseUid: { type: String, required: true },
        type: {
            type: String,
            enum: [
                "WELCOME_BONUS",
                "PURCHASE",
                "DEBIT",
                "REFUND",
                "RESERVATION",
                "RELEASE",
                "ADMIN_ADJUSTMENT",
                "EXPIRY"
            ],
            required: true
        },
        amount: { type: Number, required: true, min: 1 },
        feature: { type: String, default: null },
        description: { type: String, required: true, maxlength: 240 },
        referenceId: { type: String, default: null },
        idempotencyKey: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "REFUNDED", "RELEASED", "EXPIRED"],
            default: "COMPLETED"
        },
        allocations: { type: [allocationSchema], default: [] },
        metadata: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    { timestamps: true }
);

creditTransactionSchema.index({ firebaseUid: 1, createdAt: -1 });

const CreditTransaction = mongoose.model(
    "CreditTransaction",
    creditTransactionSchema
);

export default CreditTransaction;
