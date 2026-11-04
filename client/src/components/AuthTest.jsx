
import { useAuth } from "../context/AuthContext";

function AuthTest() {
    const {
        firebaseUser,
        appUser,
        loading,
        authError,
        isAuthenticated,
        loginWithGoogle,
        logout,
        getIdToken
    } = useAuth();

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Google login failed:", error);
            alert(error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleToken = async () => {
        try {
            const token = await getIdToken();
            console.log("Firebase ID token:", token);
            alert("Token retrieved successfully.");
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <p>Authenticating and synchronizing user...</p>;
    }

    return (
        <div style={{ padding: "30px" }}>
            <h1>InterviewAI</h1>

            {authError && (
                <p style={{ color: "red" }}>
                    Authentication error: {authError}
                </p>
            )}

            {isAuthenticated ? (
                <div>
                    <h2>Welcome, {appUser.name}</h2>

                    <img
                        src={firebaseUser.photoURL}
                        alt="Profile"
                        width="80"
                        style={{ borderRadius: "50%" }}
                    />

                    <p>Email: {appUser.email}</p>
                    <p>Role: {appUser.role}</p>
                    <p>Credits: {appUser.credits}</p>
                    <p>MongoDB ID: {appUser.id}</p>

                    <button onClick={handleToken}>
                        Test ID Token
                    </button>

                    <button onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            ) : (
                <button onClick={handleLogin}>
                    Continue with Google
                </button>
            )}
        </div>
    );
}

export default AuthTest;
