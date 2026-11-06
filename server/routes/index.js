import express from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import resumeRoutes from "./resume.routes.js";
import jobMatchRoutes from "./jobMatch.routes.js";
import interviewRoutes from "./interview.routes.js";
import creditRoutes from "./credit.routes.js";
import paymentRoutes from "./payment.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import adminRoutes from "./admin.routes.js";



const router = express.Router();


router.use("/auth", authRoutes);
// API v1 routes
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);
// Add alongside your other routes:
router.use("/resumes", resumeRoutes);

router.use("/job-matching", jobMatchRoutes);
router.use("/interviews", interviewRoutes);
router.use("/credits", creditRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);




export default router;