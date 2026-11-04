
import { updateMyProfile } from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const updateProfile = async (req, res) => {
    const user = await updateMyProfile(
        req.user._id,
        res.locals.validated.body
    );

    return sendSuccess(res, {
        statusCode: 200,
        message: "Profile updated successfully",
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role,
                credits: user.credits
            }
        }
    });
};
