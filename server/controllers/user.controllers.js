
import * as userService from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

// CREATE USER
export const createUserController = async (req, res) => {
    const { firebaseUid, name, email } = res.locals.validated.body;

    const user = await userService.createUser({
        firebaseUid,
        name,
        email
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: "User created successfully",
        data: user
    });
};

// GET ALL USERS
export const getAllUsersController = async (req, res) => {
    const { page, limit } = res.locals.validated.query;

    const result = await userService.getAllUsers(page, limit);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Users fetched successfully",
        data: result.users,
        meta: {
            page,
            limit,
            totalUsers: result.totalUsers,
            totalPages: Math.ceil(result.totalUsers / limit)
        }
    });
};

// GET USER BY ID
export const getUserByIdController = async (req, res) => {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    return sendSuccess(res, {
        message: "User fetched successfully",
        data: user
    });
};

// UPDATE USER
export const updateUserController = async (req, res) => {
    const updateData = res.locals.validated.body;

    const user = await userService.updateUser(
        req.params.id,
        updateData
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    return sendSuccess(res, {
        message: "User updated successfully",
        data: user
    });
};

// DELETE USER
export const deleteUserController = async (req, res) => {
    const user = await userService.deleteUser(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    return sendSuccess(res, {
        message: "User deleted successfully",
        data: null
    });
};
