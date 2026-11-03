import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        avatarUrl: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER"
        },

        credits: {
            type: Number,
            default: 250,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// Index for createdAt (newest first)
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;