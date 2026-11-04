
import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import loadUser from "../middleware/loadUser.middleware.js";

import { syncUser } from "../controllers/auth.controller.js";

const router = Router();

// First-time user synchronization
// Firebase identity verification only.
router.post("/sync", authenticate, syncUser);

// Existing user profile
// Firebase identity + MongoDB user lookup.
router.get("/me", authenticate, loadUser, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: {
            user: req.user
        }
    });
});

export default router;
