import User from "../models/User.js";

// CREATE USER
export const createUser = async (userData) => {
    return await User.create(userData);
};

// GET ALL USERS
export const getAllUsers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const users = await User.find()
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalUsers = await User.countDocuments();

    return {
        users,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit)
    };
};

// GET USER BY ID
export const getUserById = async (userId) => {
    return await User.findById(userId).select("-__v");
};

// UPDATE USER PROFILE
export const updateUser = async (userId, updateData) => {
    return await User.findByIdAndUpdate(
        userId,
        updateData,
        {
            new: true,
            runValidators: true
        }
    ).select("-__v");
};

// DELETE USER
export const deleteUser = async (userId) => {
    return await User.findByIdAndDelete(userId);
};