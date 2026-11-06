import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import {
    generateInterviewQuestionsController,
    startInterviewSessionController,
    submitInterviewAnswerController,
    abandonInterviewSessionController,
    getInterviewHistoryController
} from "../controllers/interview.controller.js";

const router = express.Router();

router.use(authenticate);
router.post("/questions", generateInterviewQuestionsController);
router.get("/sessions", getInterviewHistoryController);
router.post("/sessions", startInterviewSessionController);
router.post("/sessions/:sessionId/abandon", abandonInterviewSessionController);
router.post("/sessions/:sessionId/answer", submitInterviewAnswerController);

export default router;
