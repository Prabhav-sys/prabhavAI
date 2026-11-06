import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { getDashboardSummaryController } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(authenticate);
router.get("/summary", getDashboardSummaryController);

export default router;
