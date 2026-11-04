
import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import loadUser from "../middleware/loadUser.middleware.js";
import {validate} from "../middleware/validate.middleware.js";

import { updateProfile } from "../controllers/profile.controller.js";
import { updateProfileSchema } from "../validators/profile.validator.js";

const router = Router();

router.use(authenticate, loadUser);

router.patch(
    "/me",
    validate(updateProfileSchema, "body"),
    updateProfile
);

export default router;
