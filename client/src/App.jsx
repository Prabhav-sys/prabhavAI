
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import AuthSync from "./features/auth/AuthSync";

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";

import ResumeAnalysis from "./pages/ResumeAnalysis";
import JobMatching from "./pages/JobMatching";
import MockInterview from "./pages/MockInterview";
import InterviewHistory from "./pages/InterviewHistory";
import Profile from "./pages/Profile";
import Credits from "./pages/Credits";

function App() {
    return (
        <BrowserRouter>
            <AuthSync />

            <Routes>

                {/* Public layout */}
                <Route element={<MainLayout />}>
                    <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Route>

                {/* Authentication layout */}
                <Route element={<AuthLayout />}>
                    <Route
                        path="/login"
                        element={<Login />}
                    />
                </Route>

                {/* Protected application layout */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>

                        <Route
                            path="/dashboard"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/resume-analysis"
                            element={<ResumeAnalysis />}
                        />

                        <Route
                            path="/job-matching"
                            element={<JobMatching />}
                        />

                        <Route
                            path="/mock-interview"
                            element={<MockInterview />}
                        />

                        <Route
                            path="/interview-history"
                            element={<InterviewHistory />}
                        />

                        <Route
                            path="/profile"
                            element={<Profile />}
                        />

                        <Route
                            path="/credits"
                            element={<Credits />}
                        />

                    </Route>
                </Route>

                {/* Admin routes */}
                <Route element={<AdminRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route
                            path="/admin"
                            element={<AdminDashboard />}
                        />
                    </Route>
                </Route>

                {/* Fallback route */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
