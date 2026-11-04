
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(
                new UnauthorizedError("User authentication required.")
            );
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ForbiddenError(
                    "You do not have permission to access this resource."
                )
            );
        }

        next();
    };
};

export default authorize;
