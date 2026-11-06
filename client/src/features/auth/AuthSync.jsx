
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { useAuth } from "../../context/AuthContext";
import { syncUserWithBackend } from "../../services/auth.service";

import {
    setCredentials,
    clearCredentials,
    setAuthLoading,
    setAuthError
} from "./authSlice";

function AuthSync() {
    const dispatch = useDispatch();

    const { firebaseUser, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        let active = true;

        const synchronize = async () => {
            dispatch(setAuthLoading(true));

            if (!firebaseUser) {
                dispatch(clearCredentials());
                return;
            }

            try {
                const appUser = await syncUserWithBackend();

                if (active) {
                    dispatch(setCredentials(appUser));
                }
            } catch (error) {
                console.error("Authentication synchronization failed:", error);

                if (active) {
                    dispatch(setAuthError(
                        error.response?.data?.message ||
                        error.message ||
                        "Could not synchronize your account with the backend."
                    ));
                }
            }
        };

        synchronize();

        return () => {
            active = false;
        };
    }, [firebaseUser, loading, dispatch]);

    return null;
}

export default AuthSync;
