
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
    const user = useSelector((state) => state.auth.user);
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <header className="dashboard-navbar">
            <div className="navbar-title">prabhavAI Interview Workspace</div>

            <div className="navbar-user">
                <span>{user?.name || "User"}</span>

                <Link className="navbar-credits" to="/credits">
                    {user?.credits ?? 0} Credits
                </Link>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </header>
    );
}

export default Navbar;
