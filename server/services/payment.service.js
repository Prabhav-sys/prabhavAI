import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import env from "../config/env.js";
import Payment from "../models/Payment.js";
import AppError from "../utils/AppError.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import {
    creditPackages,
    getCreditWallet,
    grantPurchasedCredits
} from "./credit.service.js";

const razorpayBaseUrl = "https://api.razorpay.com/v1";

const requireRazorpay = () => {
    if (!env.razorpayKeyId || !env.razorpayKeySecret) {
        throw new AppError("Razorpay checkout is not configured.", 503);
    }
};

const razorpayRequest = async (path, options = {}) => {
    requireRazorpay();
    let response;
    try {
        response = await fetch(`${razorpayBaseUrl}${path}`, {
            ...options,
            headers: {
                Authorization: `Basic ${Buffer.from(
                    `${env.razorpayKeyId}:${env.razorpayKeySecret}`
                ).toString("base64")}`,
                "Content-Type": "application/json",
                ...options.headers
            },
            signal: AbortSignal.timeout(15000)
        });
    } catch (error) {
        const serviceError = new AppError("Razorpay could not be reached.", 502);
        serviceError.cause = error;
        throw serviceError;
    }

    let result;
    try {
        result = await response.json();
    } catch (error) {
        const serviceError = new AppError("Razorpay returned an invalid response.", 502);
        serviceError.cause = error;
        throw serviceError;
    }
    if (!response.ok) {
        throw new AppError("Razorpay could not process the payment request.", 502);
    }
    return result;
};

export const getPaymentPackages = () => ({
    provider: "RAZORPAY",
    mode: env.razorpayMode,
    configured: Boolean(env.razorpayKeyId && env.razorpayKeySecret),
    keyId: env.razorpayKeyId || null,
    packages: creditPackages.map(({ id, name, credits, amountPaise, popular }) => ({
        id,
        name,
        credits,
        amountPaise,
        priceInr: amountPaise / 100,
        ...(popular ? { popular } : {})
    }))
});

export const createPaymentOrder = async ({
    firebaseUid,
    packageId,
    idempotencyKey
}) => {
    requireRazorpay();
    const packageInfo = creditPackages.find((item) => item.id === packageId);
    if (!packageInfo) throw new AppError("Select a valid credit package.", 400);

    const existing = await Payment.findOne({ firebaseUid, idempotencyKey });
    if (existing) {
        if (existing.status === "CREATED") {
            return {
                orderId: existing.orderId,
                amountPaise: existing.amountPaise,
                currency: existing.currency,
                packageId: existing.packageId,
                credits: existing.credits
            };
        }
        throw new ConflictError("This payment request has already been processed.");
    }

    const payment = await Payment.create({
        firebaseUid,
        orderId: `pending_${randomUUID()}`,
        idempotencyKey,
        packageId: packageInfo.id,
        amountPaise: packageInfo.amountPaise,
        currency: "INR",
        credits: packageInfo.credits,
        status: "CREATING"
    });

    try {
        const order = await razorpayRequest("/orders", {
            method: "POST",
            body: JSON.stringify({
                amount: packageInfo.amountPaise,
                currency: "INR",
                receipt: `pa_${randomUUID().replaceAll("-", "").slice(0, 32)}`,
                notes: {
                    firebaseUid,
                    packageId: packageInfo.id
                }
            })
        });
        if (!order?.id || order.amount !== packageInfo.amountPaise || order.currency !== "INR") {
            throw new AppError("Razorpay returned an invalid order.", 502);
        }
        payment.orderId = order.id;
        payment.status = "CREATED";
        await payment.save();
    } catch (error) {
        payment.status = "FAILED";
        await payment.save();
        throw error;
    }

    return {
        orderId: payment.orderId,
        amountPaise: payment.amountPaise,
        currency: payment.currency,
        packageId: payment.packageId,
        credits: payment.credits
    };
};

const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
    if (!env.razorpayKeySecret) {
        throw new AppError("Razorpay signature verification is not configured.", 503);
    }
    const expected = createHmac("sha256", env.razorpayKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest();
    let received;
    try {
        received = Buffer.from(signature, "hex");
    } catch {
        throw new AppError("Invalid Razorpay payment signature.", 400);
    }
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        throw new AppError("Invalid Razorpay payment signature.", 400);
    }
};

const confirmCapturedPayment = async ({ paymentRecord, paymentGatewayId }) => {
    const payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentGatewayId)}`);
    if (
        payment.order_id !== paymentRecord.orderId ||
        payment.amount !== paymentRecord.amountPaise ||
        payment.currency !== paymentRecord.currency
    ) {
        throw new AppError("The payment does not match the credit order.", 400);
    }
    if (payment.status !== "captured") {
        throw new ConflictError("Payment is not captured yet. Please wait for confirmation.");
    }
};

export const verifyPayment = async ({
    firebaseUid,
    orderId,
    paymentId,
    signature
}) => {
    verifyCheckoutSignature({ orderId, paymentId, signature });
    const payment = await Payment.findOne({ firebaseUid, orderId });
    if (!payment) throw new NotFoundError("Payment order not found.");
    if (payment.status === "PAID") {
        return { wallet: await getCreditWallet(firebaseUid), alreadyCredited: true };
    }

    await confirmCapturedPayment({ paymentRecord: payment, paymentGatewayId: paymentId });
    await grantPurchasedCredits({
        paymentId: payment._id,
        paymentGatewayId: paymentId
    });
    return { wallet: await getCreditWallet(firebaseUid), alreadyCredited: false };
};

export const processRazorpayWebhook = async ({
    rawBody,
    signature,
    eventId,
    event
}) => {
    if (!env.razorpayWebhookSecret) {
        throw new AppError("Razorpay webhook verification is not configured.", 503);
    }
    if (!Buffer.isBuffer(rawBody) || !signature) {
        throw new AppError("Invalid Razorpay webhook request.", 400);
    }

    const expected = createHmac("sha256", env.razorpayWebhookSecret)
        .update(rawBody)
        .digest();
    const received = Buffer.from(signature, "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        throw new AppError("Invalid Razorpay webhook signature.", 400);
    }

    if (!["payment.captured", "order.paid"].includes(event?.event)) {
        return { processed: false };
    }

    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const paymentId = paymentEntity?.id;
    const orderId = paymentEntity?.order_id || orderEntity?.id;
    if (!paymentId || !orderId) {
        throw new AppError("Razorpay webhook is missing payment details.", 400);
    }

    const paymentRecord = await Payment.findOne({ orderId });
    if (!paymentRecord) throw new NotFoundError("Payment order not found.");
    if (
        paymentEntity &&
        (
            paymentEntity.amount !== paymentRecord.amountPaise ||
            paymentEntity.currency !== paymentRecord.currency
        )
    ) {
        throw new AppError("Webhook payment does not match the credit order.", 400);
    }

    await grantPurchasedCredits({
        paymentId: paymentRecord._id,
        paymentGatewayId: paymentId,
        webhookEventId: eventId
    });
    return { processed: true };
};

export const listMyPayments = (firebaseUid) => Payment.find({ firebaseUid })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("packageId amountPaise currency credits status orderId paymentId createdAt creditedAt")
    .lean();
