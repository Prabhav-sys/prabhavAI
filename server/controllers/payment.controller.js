import { z } from "zod";
import {
    createPaymentOrder,
    getPaymentPackages,
    listMyPayments,
    processRazorpayWebhook,
    verifyPayment
} from "../services/payment.service.js";

const orderSchema = z.object({
    packageId: z.enum(["starter", "pro", "power"])
}).strict();

const verificationSchema = z.object({
    razorpay_order_id: z.string().min(1).max(100),
    razorpay_payment_id: z.string().min(1).max(100),
    razorpay_signature: z.string().min(1).max(256)
}).strict();

const requestIdempotencyKey = (req) => {
    const key = req.get("Idempotency-Key");
    if (!key || key.length < 16 || key.length > 128) return null;
    return key;
};

export const createPaymentOrderController = async (req, res, next) => {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: "Select a valid credit package."
        });
    }

    const idempotencyKey = requestIdempotencyKey(req);
    if (!idempotencyKey) {
        return res.status(400).json({
            success: false,
            message: "A valid Idempotency-Key header is required."
        });
    }

    try {
        const order = await createPaymentOrder({
            firebaseUid: req.auth.uid,
            packageId: parsed.data.packageId,
            idempotencyKey
        });
        return res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPaymentController = async (req, res, next) => {
    const parsed = verificationSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment verification request."
        });
    }

    try {
        const result = await verifyPayment({
            firebaseUid: req.auth.uid,
            orderId: parsed.data.razorpay_order_id,
            paymentId: parsed.data.razorpay_payment_id,
            signature: parsed.data.razorpay_signature
        });
        return res.status(200).json({
            success: true,
            message: "Payment verified and credits added.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const listMyPaymentsController = async (req, res, next) => {
    try {
        const payments = await listMyPayments(req.auth.uid);
        return res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

export const getPaymentPackagesController = (req, res) => res.status(200).json({
    success: true,
    data: getPaymentPackages()
});

export const razorpayWebhookController = async (req, res, next) => {
    try {
        const result = await processRazorpayWebhook({
            rawBody: req.rawBody,
            signature: req.get("X-Razorpay-Signature"),
            eventId: req.get("X-Razorpay-Event-Id"),
            event: req.body
        });
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};
