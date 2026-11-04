
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute() {
    const { appUser, loading, isAuthenticated } = useAuth();

    if (loading) {
        return <p>Loading account permissions...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (appUser.role !== "ADMIN") {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

export default AdminRoute;
