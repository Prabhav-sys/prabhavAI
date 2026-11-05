
import express from "express";
import authenticate from "../middleware/auth.middleware.js";

import {
    createJobMatchController,
    listJobMatchesController,
    getJobMatchController
} from "../controllers/jobMatch.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/match", createJobMatchController);
router.get("/", listJobMatchesController);
router.get("/:matchId", getJobMatchController);

export default router;
