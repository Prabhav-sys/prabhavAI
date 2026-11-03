
import User from "../models/User.js";
import { NotFoundError } from "../utils/errors.js";

import {
    buildPagination,
    buildSort,
    escapeRegex
} from "../utils/queryBuilder.js";

// CREATE USER
export const createUser = async (userData) => {
    return await User.create(userData);
};

// GET ALL USERS
export const getAllUsers = async ({
    page = 1,
    limit = 10,
    role,
    sortBy = "createdAt",
    order = "desc",
    search
}) => {
    const { skip } = buildPagination(page, limit);

    const sort = buildSort(sortBy, order);

    const filter = {};

    // Filtering
    if (role) {
        filter.role = role;
    }

    // Searching
    if (search) {
        const searchRegex = new RegExp(
            escapeRegex(search),
            "i"
        );

        filter.$or = [
            { name: searchRegex },
            { email: searchRegex }
        ];
    }

    // Fetch records and count in parallel
    const [users, total] = await Promise.all([
        User.find(filter)
            .select("name email avatarUrl createdAt")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),

        User.countDocuments(filter)
    ]);

    return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// GET USER BY ID
export const getUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};

// UPDATE USER
export const updateUser = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        {
            new: true,
            runValidators: true
        }
    );

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};

// DELETE USER
export const deleteUser = async (userId) => {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};
