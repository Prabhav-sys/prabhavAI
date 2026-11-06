import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
    createPaymentOrderController,
    getPaymentPackagesController,
    listMyPaymentsController,
    razorpayWebhookController,
    verifyPaymentController
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/webhook", razorpayWebhookController);
router.use(authenticate);
router.get("/packages", getPaymentPackagesController);
router.get("/", listMyPaymentsController);
router.post("/orders", createPaymentOrderController);
router.post("/verify", verifyPaymentController);

export default router;
