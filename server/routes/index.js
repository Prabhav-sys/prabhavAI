import express from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";

const router = express.Router();


router.use("/auth", authRoutes);
// API v1 routes
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);

export default router;