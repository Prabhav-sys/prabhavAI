
import { Outlet } from "react-router-dom";

import Sidebar from "../components/shared/Sidebar";
import Navbar from "../components/shared/Navbar";

function DashboardLayout() {
    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <Navbar />

                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
