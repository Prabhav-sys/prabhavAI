import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import authorize from "../middleware/authorize.middleware.js";
import loadUser from "../middleware/loadUser.middleware.js";
import { getAdminDashboardController } from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticate, loadUser, authorize("ADMIN"));
router.get("/dashboard", getAdminDashboardController);

export default router;
