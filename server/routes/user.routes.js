
import express from "express";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
    createUserSchema,
    updateUserSchema,
    paginationSchema
} from "../validators/user.validator.js";

import {
    createUserController,
    getAllUsersController,
    getUserByIdController,
    updateUserController,
    deleteUserController
} from "../controllers/user.controllers.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - name
 *               - email
 *             properties:
 *               firebaseUid:
 *                 type: string
 *                 example: firebase-user-123
 *               name:
 *                 type: string
 *                 example: Prabhat
 *               email:
 *                 type: string
 *                 example: prabhat@example.com
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: User already exists
 */
router.post(
    "/",
    validate(createUserSchema),
    asyncHandler(createUserController)
);

router.get(
    "/",
    validate(paginationSchema, "query"),
    asyncHandler(getAllUsersController)
);

router.get(
    "/:id",
    asyncHandler(getUserByIdController)
);

router.patch(
    "/:id",
    validate(updateUserSchema),
    asyncHandler(updateUserController)
);

router.delete(
    "/:id",
    asyncHandler(deleteUserController)
);

export default router;
