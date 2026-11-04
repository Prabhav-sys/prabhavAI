
import { useSelector } from "react-redux";

import PageHeader from "../components/common/PageHeader";

import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import QuickActions from "../components/QuickActions";
import RecentActivity from "../components/RecentActivity";

import "../index.css";

function Dashboard() {
    const user = useSelector((state) => state.auth.user);

    return (
        <div className="dashboard-page">

            <PageHeader
                title="Overview"
                description="Your personal interview preparation workspace."
            />

            <WelcomeSection
                name={user?.name?.split(" ")[0]}
            />

            <StatsCards
                credits={user?.credits}
            />

            <QuickActions />

            <RecentActivity />

        </div>
    );
}

export default Dashboard;
