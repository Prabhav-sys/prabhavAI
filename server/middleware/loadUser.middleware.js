
import User from "../models/User.js";
import { UnauthorizedError } from "../utils/errors.js";

const loadUser = async (req, res, next) => {
    try {
        const user = await User.findOne({
            firebaseUid: req.auth.uid
        }).select("_id firebaseUid name email role credits");

        if (!user) {
            throw new UnauthorizedError(
                "Application user not found. Please synchronize your account."
            );
        }

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};

export default loadUser;
