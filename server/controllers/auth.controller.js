
import { syncFirebaseUser } from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const syncUser = async (req, res) => {
    const user = await syncFirebaseUser({
        firebaseUid: req.auth.uid,
        name: req.auth.name || req.auth.email?.split("@")[0] || "User",
        email: req.auth.email,
        avatarUrl: req.auth.picture || ""
    });

    return sendSuccess(res, {
        statusCode: 200,
        message: "User synchronized successfully",
        data: {
            user: {
                id: user._id,
                firebaseUid: user.firebaseUid,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role,
                credits: user.credits,
                createdAt: user.createdAt
            }
        }
    });
};
