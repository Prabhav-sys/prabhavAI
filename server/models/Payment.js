import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        firebaseUid: { type: String, required: true, index: true },
        provider: { type: String, enum: ["RAZORPAY"], default: "RAZORPAY" },
        orderId: { type: String, required: true, unique: true },
        paymentId: { type: String, unique: true, sparse: true },
        packageId: { type: String, required: true },
        amountPaise: { type: Number, required: true, min: 1 },
        currency: { type: String, enum: ["INR"], default: "INR" },
        credits: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: ["CREATING", "CREATED", "PAID", "FAILED"],
            default: "CREATED",
            index: true
        },
        idempotencyKey: { type: String, required: true, unique: true },
        creditedAt: { type: Date, default: null },
        webhookEventIds: { type: [String], default: [] }
    },
    { timestamps: true }
);

paymentSchema.index({ firebaseUid: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
