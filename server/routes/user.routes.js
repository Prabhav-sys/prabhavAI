
import express from "express";

import authenticate from "../middleware/auth.middleware.js";
import loadUser from "../middleware/loadUser.middleware.js";
import authorize from "../middleware/authorize.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
    createUserSchema,
    updateUserSchema,
    userQuerySchema
} from "../validators/user.validator.js";

import {
    createUserController,
    getAllUsersController,
    getUserByIdController,
    updateUserController,
    deleteUserController
} from "../controllers/user.controllers.js";

const router = express.Router();

// All user CRUD routes require authentication and ADMIN role.
router.use(
    authenticate,
    loadUser,
    authorize("ADMIN")
);

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

// CREATE USER
router.post(
    "/",
    validate(createUserSchema),
    asyncHandler(createUserController)
);

// GET ALL USERS
router.get(
    "/",
    validate(userQuerySchema, "query"),
    asyncHandler(getAllUsersController)
);

// GET USER BY ID
router.get(
    "/:id",
    asyncHandler(getUserByIdController)
);

// UPDATE USER
router.patch(
    "/:id",
    validate(updateUserSchema),
    asyncHandler(updateUserController)
);

// DELETE USER
router.delete(
    "/:id",
    asyncHandler(deleteUserController)
);

export default router;
