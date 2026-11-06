import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
    getCreditPricingController,
    getCreditTransactionsController,
    getCreditWalletController
} from "../controllers/credit.controller.js";

const router = express.Router();

router.use(authenticate);
router.get("/pricing", getCreditPricingController);
router.get("/wallet", getCreditWalletController);
router.get("/transactions", getCreditTransactionsController);

export default router;
