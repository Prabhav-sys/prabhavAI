import express from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import resumeRoutes from "./resume.routes.js";
import jobMatchRoutes from "./jobMatch.routes.js";



const router = express.Router();


router.use("/auth", authRoutes);
// API v1 routes
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);
// Add alongside your other routes:
router.use("/resumes", resumeRoutes);

router.use("/job-matching", jobMatchRoutes);




export default router;