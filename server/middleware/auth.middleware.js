
import { firebaseAdminAuth } from "../config/firebaseAdmin.js";
import { UnauthorizedError } from "../utils/errors.js";

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError(
                "Authentication token is required."
            );
        }

        const idToken = authHeader.split(" ")[1];

        if (!idToken) {
            throw new UnauthorizedError(
                "Authentication token is required."
            );
        }

        const decodedToken =
            await firebaseAdminAuth.verifyIdToken(idToken);

        req.auth = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            emailVerified: decodedToken.email_verified
        };

        next();

    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return next(error);
        }

        return next(
            new UnauthorizedError(
                "Invalid or expired authentication token."
            )
        );
    }
};

export default authenticate;
