
import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { uploadResume } from "../middleware/resumeUpload.middleware.js";
import {
    uploadResumeController,
    reanalyzeResumeController,
    listResumesController,
    getResumeController,
    deleteResumeController
} from "../controllers/resume.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/upload", uploadResume, uploadResumeController);
router.post("/:resumeId/reanalyze", reanalyzeResumeController);
router.get("/", listResumesController);
router.get("/:resumeId", getResumeController);
router.delete("/:resumeId", deleteResumeController);

export default router;
