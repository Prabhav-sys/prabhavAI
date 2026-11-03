import express from "express";
import userRoutes from "./user.routes.js";

const router = express.Router();

// API v1 routes
router.use("/users", userRoutes);

export default router;