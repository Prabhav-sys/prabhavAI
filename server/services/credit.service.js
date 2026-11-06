import mongoose from "mongoose";
import User from "../models/User.js";
import CreditLot from "../models/CreditLot.js";
import CreditTransaction from "../models/CreditTransaction.js";
import CreditReservation from "../models/CreditReservation.js";
import Payment from "../models/Payment.js";
import {
    ConflictError,
    InsufficientCreditsError,
    NotFoundError
} from "../utils/errors.js";

const WELCOME_CREDITS = 250;
const WELCOME_EXPIRY_DAYS = 90;
const PURCHASE_EXPIRY_DAYS = 365;
const featureCosts = Object.freeze({
    RESUME_ANALYSIS: 35,
    RESUME_REANALYSIS: 20,
    JOB_MATCH: 15,
    INTERVIEW: Object.freeze({ 5: 30, 10: 50, 20: 85, full: 100 })
});

export const creditPackages = Object.freeze([
    { id: "starter", name: "Starter", credits: 500, amountPaise: 24900 },
    { id: "pro", name: "Pro", credits: 1200, amountPaise: 49900, popular: true },
    { id: "power", name: "Power", credits: 3500, amountPaise: 99900 }
]);

const expiration = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const withTransaction = async (operation) => {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await operation(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
};

export const getFeatureCost = (feature, questionCount, fullInterview = false) => {
    if (feature === "INTERVIEW") {
        const cost = fullInterview
            ? featureCosts.INTERVIEW.full
            : featureCosts.INTERVIEW[questionCount];
        if (!cost) throw new Error("Unsupported interview length.");
        return cost;
    }
    const cost = featureCosts[feature];
    if (!cost) throw new Error("Unsupported credit feature.");
    return cost;
};

export const calculateInterviewCharge = ({
    reservedCredits,
    answeredCount,
    questionCount,
    fullInterview = false,
    elapsedMs = 0,
    maxDurationMs
}) => {
    if (answeredCount <= 0) return 0;
    if (!fullInterview) {
        return Math.ceil(reservedCredits * answeredCount / questionCount);
    }
    if (!Number.isFinite(maxDurationMs) || maxDurationMs <= 0) {
        throw new Error("A positive maximum duration is required for full interviews.");
    }
    return Math.ceil(
        reservedCredits * Math.min(Math.max(elapsedMs, 0) / maxDurationMs, 1)
    );
};

export const getCreditPricing = () => ({
    features: {
        resumeAnalysis: featureCosts.RESUME_ANALYSIS,
        resumeReanalysis: featureCosts.RESUME_REANALYSIS,
        jobMatch: featureCosts.JOB_MATCH,
        interview: featureCosts.INTERVIEW
    },
    packages: creditPackages.map(({ id, name, credits, amountPaise, popular }) => ({
        id,
        name,
        credits,
        priceInr: amountPaise / 100,
        ...(popular ? { popular } : {})
    }))
});

export const ensureCreditWallet = async (firebaseUid) => withTransaction(async (session) => {
    const user = await User.findOne({ firebaseUid }).session(session);
    if (!user) throw new NotFoundError("User not found.");
    if (user.creditsWalletInitialized) return user;

    const balance = Number.isSafeInteger(user.credits)
        ? user.credits
        : WELCOME_CREDITS;
    if (balance > 0) {
        const [lot] = await CreditLot.create([{
            firebaseUid,
            source: "WELCOME",
            grantedCredits: balance,
            remainingCredits: balance,
            expiresAt: expiration(WELCOME_EXPIRY_DAYS),
            referenceId: `welcome:${firebaseUid}`
        }], { session });

        await CreditTransaction.create([{
            firebaseUid,
            type: "WELCOME_BONUS",
            amount: balance,
            description: "Welcome credits",
            referenceId: lot.id,
            idempotencyKey: `welcome:${firebaseUid}`
        }], { session });
    }

    user.creditsWalletInitialized = true;
    await user.save({ session });
    return user;
});

const expireAvailableCredits = async (firebaseUid) => withTransaction(async (session) => {
    const now = new Date();
    const expiredLots = await CreditLot.find({
        firebaseUid,
        remainingCredits: { $gt: 0 },
        expiresAt: { $lte: now }
    }).session(session);

    if (!expiredLots.length) return;
    const total = expiredLots.reduce((sum, lot) => sum + lot.remainingCredits, 0);

    for (const lot of expiredLots) {
        const amount = lot.remainingCredits;
        lot.remainingCredits = 0;
        await lot.save({ session });
        await CreditTransaction.create([{
            firebaseUid,
            type: "EXPIRY",
            amount,
            description: "Credits expired",
            referenceId: lot.id,
            idempotencyKey: `expiry:${lot.id}`
        }], { session });
    }

    const user = await User.findOneAndUpdate(
        { firebaseUid, credits: { $gte: total } },
        { $inc: { credits: -total } },
        { new: true, session }
    );
    if (!user) throw new Error("Credit wallet is inconsistent while expiring credits.");
});

export const reserveCredits = async ({
    firebaseUid,
    amount,
    feature,
    referenceId,
    idempotencyKey,
    expiresInMinutes = 180
}) => {
    await ensureCreditWallet(firebaseUid);
    await expireAvailableCredits(firebaseUid);

    if (!idempotencyKey || idempotencyKey.length > 128) {
        throw new Error("A valid credit idempotency key is required.");
    }

    return withTransaction(async (session) => {
        const existing = await CreditReservation.findOne({ idempotencyKey }).session(session);
        if (existing) {
            throw new ConflictError("This credit operation has already been processed.");
        }

        const user = await User.findOne({ firebaseUid }).session(session);
        if (!user) throw new NotFoundError("User not found.");
        if (user.credits < amount) {
            throw new InsufficientCreditsError(amount, user.credits);
        }

        const lots = await CreditLot.find({
            firebaseUid,
            remainingCredits: { $gt: 0 },
            expiresAt: { $gt: new Date() }
        })
            .sort({ expiresAt: 1, createdAt: 1 })
            .session(session);

        let remaining = amount;
        const allocations = [];
        for (const lot of lots) {
            if (remaining === 0) break;
            const allocated = Math.min(lot.remainingCredits, remaining);
            lot.remainingCredits -= allocated;
            await lot.save({ session });
            allocations.push({ lotId: lot._id, credits: allocated });
            remaining -= allocated;
        }
        if (remaining !== 0) {
            throw new Error("Credit wallet lots do not match the available balance.");
        }

        user.credits -= amount;
        await user.save({ session });

        const [reservation] = await CreditReservation.create([{
            firebaseUid,
            feature,
            referenceId,
            idempotencyKey,
            amount,
            allocations,
            expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000)
        }], { session });
        await CreditTransaction.create([{
            firebaseUid,
            type: "RESERVATION",
            amount,
            feature,
            description: `Credits reserved for ${feature.toLowerCase().replaceAll("_", " ")}`,
            referenceId,
            idempotencyKey: `${idempotencyKey}:reserve`,
            allocations
        }], { session });
        return reservation;
    });
};

const returnAllocations = async ({ firebaseUid, allocations, amount, session }) => {
    let remaining = amount;
    const returned = [];

    for (const allocation of allocations) {
        if (remaining === 0) break;
        const credits = Math.min(allocation.credits, remaining);
        await CreditLot.updateOne(
            { _id: allocation.lotId, firebaseUid },
            { $inc: { remainingCredits: credits } },
            { session }
        );
        returned.push({ lotId: allocation.lotId, credits });
        remaining -= credits;
    }
    if (remaining !== 0) throw new Error("Credit reservation allocations are inconsistent.");
    return returned;
};

export const settleReservation = async ({
    reservationId,
    capturedCredits,
    description
}) => withTransaction(async (session) => {
    const reservation = await CreditReservation.findById(reservationId).session(session);
    if (!reservation) throw new NotFoundError("Credit reservation not found.");
    if (reservation.status !== "RESERVED") {
        throw new ConflictError("This credit reservation has already been settled.");
    }
    if (!Number.isInteger(capturedCredits) ||
        capturedCredits < 0 ||
        capturedCredits > reservation.amount) {
        throw new Error("Invalid credit reservation settlement amount.");
    }

    const releaseAmount = reservation.amount - capturedCredits;
    const consumedAllocations = [];
    let remainingCapture = capturedCredits;
    for (const allocation of reservation.allocations) {
        if (remainingCapture === 0) break;
        const credits = Math.min(allocation.credits, remainingCapture);
        consumedAllocations.push({ lotId: allocation.lotId, credits });
        remainingCapture -= credits;
    }

    if (capturedCredits > 0) {
        await CreditTransaction.create([{
            firebaseUid: reservation.firebaseUid,
            type: "DEBIT",
            amount: capturedCredits,
            feature: reservation.feature,
            description,
            referenceId: reservation.referenceId,
            idempotencyKey: `${reservation.idempotencyKey}:debit`,
            allocations: consumedAllocations
        }], { session });
    }

    if (releaseAmount > 0) {
        const released = await returnAllocations({
            firebaseUid: reservation.firebaseUid,
            allocations: reservation.allocations.map((allocation, index) => ({
                lotId: allocation.lotId,
                credits: allocation.credits - (consumedAllocations[index]?.credits || 0)
            })).filter((allocation) => allocation.credits > 0),
            amount: releaseAmount,
            session
        });
        await User.updateOne(
            { firebaseUid: reservation.firebaseUid },
            { $inc: { credits: releaseAmount } },
            { session }
        );
        await CreditTransaction.create([{
            firebaseUid: reservation.firebaseUid,
            type: "RELEASE",
            amount: releaseAmount,
            feature: reservation.feature,
            description: "Unused reserved credits released",
            referenceId: reservation.referenceId,
            idempotencyKey: `${reservation.idempotencyKey}:release`,
            allocations: released
        }], { session });
    }

    reservation.capturedCredits = capturedCredits;
    reservation.status = releaseAmount === 0 ? "CAPTURED" : "PARTIAL";
    await reservation.save({ session });
    return reservation;
});

export const refundReservation = async ({ reservationId, description }) =>
    withTransaction(async (session) => {
        const reservation = await CreditReservation.findById(reservationId).session(session);
        if (!reservation) throw new NotFoundError("Credit reservation not found.");
        if (reservation.status !== "RESERVED") {
            if (reservation.status === "REFUNDED") return reservation;
            throw new ConflictError("This credit reservation has already been settled.");
        }

        const allocations = reservation.allocations.map((allocation) => ({
            lotId: allocation.lotId,
            credits: allocation.credits
        }));
        await returnAllocations({
            firebaseUid: reservation.firebaseUid,
            allocations,
            amount: reservation.amount,
            session
        });
        await User.updateOne(
            { firebaseUid: reservation.firebaseUid },
            { $inc: { credits: reservation.amount } },
            { session }
        );
        await CreditTransaction.create([{
            firebaseUid: reservation.firebaseUid,
            type: "REFUND",
            amount: reservation.amount,
            feature: reservation.feature,
            description,
            referenceId: reservation.referenceId,
            idempotencyKey: `${reservation.idempotencyKey}:refund`,
            allocations
        }], { session });

        reservation.status = "REFUNDED";
        await reservation.save({ session });
        return reservation;
    });

export const getCreditWallet = async (firebaseUid) => {
    await ensureCreditWallet(firebaseUid);
    await expireAvailableCredits(firebaseUid);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [user, lots, transactions, monthlyDebits] = await Promise.all([
        User.findOne({ firebaseUid }).select("credits").lean(),
        CreditLot.find({ firebaseUid, remainingCredits: { $gt: 0 } })
            .sort({ expiresAt: 1 })
            .select("source remainingCredits expiresAt")
            .lean(),
        CreditTransaction.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .limit(50)
            .select("type amount feature description referenceId createdAt")
            .lean(),
        CreditTransaction.aggregate([
            {
                $match: {
                    firebaseUid,
                    type: "DEBIT",
                    createdAt: { $gte: monthStart }
                }
            },
            { $group: { _id: "$feature", credits: { $sum: "$amount" } } }
        ])
    ]);

    return {
        balance: user?.credits ?? 0,
        creditsUsedThisMonth: monthlyDebits.reduce((sum, item) => sum + item.credits, 0),
        usageByFeature: monthlyDebits.map((item) => ({
            feature: item._id,
            credits: item.credits
        })),
        lots,
        transactions
    };
};

export const getCreditTransactionHistory = async (firebaseUid) => {
    await ensureCreditWallet(firebaseUid);
    return CreditTransaction.find({ firebaseUid })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("type amount feature description referenceId status createdAt")
        .lean();
};

export const grantPurchasedCredits = async ({
    paymentId,
    paymentGatewayId,
    webhookEventId
}) => withTransaction(async (session) => {
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) throw new NotFoundError("Payment record not found.");
    if (payment.status === "PAID") return payment;

    const transactionKey = `purchase:${payment.orderId}`;
    const [lot] = await CreditLot.create([{
        firebaseUid: payment.firebaseUid,
        source: "PURCHASE",
        grantedCredits: payment.credits,
        remainingCredits: payment.credits,
        expiresAt: expiration(PURCHASE_EXPIRY_DAYS),
        referenceId: payment.orderId
    }], { session });
    await User.updateOne(
        { firebaseUid: payment.firebaseUid },
        { $inc: { credits: payment.credits } },
        { session }
    );
    await CreditTransaction.create([{
        firebaseUid: payment.firebaseUid,
        type: "PURCHASE",
        amount: payment.credits,
        description: `Purchased ${payment.credits} credits`,
        referenceId: payment.orderId,
        idempotencyKey: transactionKey,
        allocations: [{ lotId: lot._id, credits: payment.credits }]
    }], { session });

    payment.status = "PAID";
    payment.paymentId = paymentGatewayId;
    payment.creditedAt = new Date();
    if (webhookEventId && !payment.webhookEventIds.includes(webhookEventId)) {
        payment.webhookEventIds.push(webhookEventId);
    }
    await payment.save({ session });
    return payment;
});
