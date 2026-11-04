
import User from "../models/User.js";

import {
    NotFoundError,
    ConflictError
} from "../utils/errors.js";

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

// UPDATE USER (ADMIN CRUD)
export const updateUser = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};

// UPDATE MY PROFILE
export const updateMyProfile = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                name: updateData.name
            }
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).select(
        "_id firebaseUid name email avatarUrl role credits createdAt"
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

// SYNC FIREBASE USER WITH MONGODB
export const syncFirebaseUser = async ({
    firebaseUid,
    name,
    email,
    avatarUrl
}) => {
    try {
        const user = await User.findOneAndUpdate(
            { firebaseUid },
            {
                $set: {
                    name,
                    email: email.toLowerCase(),
                    avatarUrl: avatarUrl || ""
                },
                $setOnInsert: {
                    firebaseUid
                }
            },
            {
                returnDocument: "after",
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return user;

    } catch (error) {
        if (error.code === 11000) {

            // A different Firebase account may already own this email.
            if (error.keyPattern?.email) {
                throw new ConflictError(
                    "This email is already associated with another account."
                );
            }

            // Handle concurrent first-time login for the same Firebase UID.
            if (error.keyPattern?.firebaseUid) {
                const existingUser = await User.findOne({ firebaseUid });

                if (existingUser) {
                    return User.findOneAndUpdate(
                        { firebaseUid },
                        {
                            $set: {
                                name,
                                email: email.toLowerCase(),
                                avatarUrl: avatarUrl || ""
                            }
                        },
                        {
                            returnDocument: "after",
                            runValidators: true
                        }
                    );
                }
            }
        }

        throw error;
    }
};
