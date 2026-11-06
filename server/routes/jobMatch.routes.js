
import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { uploadJobDescriptionPdf } from "../middleware/jobDescriptionUpload.middleware.js";

import {
    createJobMatchController,
    listJobMatchesController,
    getJobMatchController
} from "../controllers/jobMatch.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/match", uploadJobDescriptionPdf, createJobMatchController);
router.get("/", listJobMatchesController);
router.get("/:matchId", getJobMatchController);

export default router;
