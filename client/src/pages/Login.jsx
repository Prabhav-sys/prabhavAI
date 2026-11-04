
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const { loginWithGoogle } = useAuth();

    const { isAuthenticated, loading } = useSelector(
        (state) => state.auth
    );

    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState("");

    // Navigate after Firebase + MongoDB synchronization succeeds.
    useEffect(() => {
        if (!loading && isAuthenticated) {
            const destination =
                location.state?.from?.pathname || "/dashboard";

            navigate(destination, { replace: true });
        }
    }, [isAuthenticated, loading, navigate, location.state]);

    const handleLogin = async () => {
        try {
            setError("");
            setLoginLoading(true);

            await loginWithGoogle();

            // AuthSync will detect the Firebase login,
            // synchronize MongoDB, and update Redux.
            // The useEffect above performs navigation.
        } catch (err) {
            console.error("Google login failed:", err);
            setError(err.message || "Unable to sign in.");
        } finally {
            setLoginLoading(false);
        }
    };

    if (loading) {
        return <p>Checking your authentication...</p>;
    }

    if (isAuthenticated) {
        return <p>Opening your dashboard...</p>;
    }

    return (
        <div>
            <h1>InterviewAI Login</h1>

            <button
                onClick={handleLogin}
                disabled={loginLoading}
            >
                {loginLoading
                    ? "Signing in..."
                    : "Continue with Google"}
            </button>

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export default Login;
