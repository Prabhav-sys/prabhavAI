
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../components/ui/Loader";


function ProtectedRoute() {
    const { isAuthenticated, loading } = useSelector(
        (state) => state.auth
    );

    const location = useLocation();

    if (loading) {
    return <Loader message="Checking your account..." fullScreen />;
}

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;
