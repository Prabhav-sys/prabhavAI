
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { useAuth } from "../context/AuthContext";
import "../features/auth/login.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const { loginWithGoogle } = useAuth();

    const {
        isAuthenticated,
        loading,
        error: authError
    } = useSelector((state) => state.auth);

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
            if (err.code === "auth/unauthorized-domain") {
                setError(
                    "This sign-in address is not authorized by Firebase. " +
                    "Use http://localhost:5173 instead of 127.0.0.1."
                );
            } else if (err.code === "auth/popup-closed-by-user") {
                setError("The Google sign-in window was closed before login completed.");
            } else {
                setError(err.message || "Unable to sign in.");
            }
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="login-page">
            <section className="login-story">
                <Link to="/" className="login-brand">
                    <span className="login-brand-mark">p</span>
                    <span>prabhav<span>AI</span></span>
                </Link>

                <div className="login-story-copy">
                    <span className="login-eyebrow">YOUR NEXT INTERVIEW, REHEARSED</span>
                    <h1>Show up ready for the conversation.</h1>
                    <p>
                        Practice with an AI interviewer that knows your resume,
                        understands the role, and asks the follow-ups a real
                        interviewer would.
                    </p>
                </div>

                <div className="login-journey" aria-label="How prabhavAI works">
                    <div className="login-journey-step">
                        <span>01</span>
                        <div><strong>Share your resume</strong><small>Build your interview context</small></div>
                    </div>
                    <i aria-hidden="true" />
                    <div className="login-journey-step">
                        <span>02</span>
                        <div><strong>Choose your target</strong><small>Role, level and job fit</small></div>
                    </div>
                    <i aria-hidden="true" />
                    <div className="login-journey-step">
                        <span>03</span>
                        <div><strong>Practice out loud</strong><small>Get a clear, useful debrief</small></div>
                    </div>
                </div>

                <div className="login-story-foot">
                    <span>Resume-aware</span><i /> <span>Voice-first</span><i /> <span>Built for practice</span>
                </div>
            </section>

            <section className="login-panel">
                <div className="login-panel-card">
                    <div className="login-panel-icon" aria-hidden="true">✦</div>
                    {loading || isAuthenticated ? (
                        <>
                            <span className="login-panel-eyebrow">SECURE SIGN IN</span>
                            <h2>{loading ? "Getting your space ready" : "Welcome back"}</h2>
                            <p>{loading ? "Checking your prabhavAI account..." : "Opening your interview workspace..."}</p>
                            <div className="login-loading-line"><i /></div>
                        </>
                    ) : (
                        <>
                            <span className="login-panel-eyebrow">YOUR PRACTICE SPACE</span>
                            <h2>Make the next interview feel familiar.</h2>
                            <p>
                                Sign in to prepare with your resume, run a tailored
                                voice interview, and keep your feedback in one place.
                            </p>
                            <button
                                className="google-login-button"
                                onClick={handleLogin}
                                disabled={loginLoading}
                            >
                                <span className="google-mark" aria-hidden="true">G</span>
                                {loginLoading ? "Connecting securely..." : "Continue with Google"}
                                {!loginLoading && <span className="login-button-arrow" aria-hidden="true">→</span>}
                            </button>
                            {(error || authError) && (
                                <p className="login-error" role="alert">{error || authError}</p>
                            )}
                            <p className="login-terms">
                                By continuing, you agree to use prabhavAI for interview practice.
                                Your resume and answers are handled according to your account settings.
                            </p>
                        </>
                    )}
                </div>
                <span className="login-panel-footer">A calmer way to prepare for what’s next.</span>
            </section>
        </div>
    );
}

export default Login;
