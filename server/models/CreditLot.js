import mongoose from "mongoose";

const creditLotSchema = new mongoose.Schema(
    {
        firebaseUid: { type: String, required: true, index: true },
        source: {
            type: String,
            enum: ["WELCOME", "PURCHASE", "PROMO", "REFUND"],
            required: true
        },
        grantedCredits: { type: Number, required: true, min: 1 },
        remainingCredits: { type: Number, required: true, min: 0 },
        expiresAt: { type: Date, required: true },
        referenceId: { type: String, default: null }
    },
    { timestamps: true }
);

creditLotSchema.index({ firebaseUid: 1, remainingCredits: 1, expiresAt: 1 });

const CreditLot = mongoose.model("CreditLot", creditLotSchema);

export default CreditLot;
