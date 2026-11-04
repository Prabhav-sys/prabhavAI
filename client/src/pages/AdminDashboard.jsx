
import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";

import "../features/dashboard/admin.css";

function AdminDashboard() {
    const metrics = [
        {
            title: "Total Users",
            value: "—",
            description: "Registered platform users"
        },
        {
            title: "Active Users",
            value: "—",
            description: "Currently active accounts"
        },
        {
            title: "Interview Sessions",
            value: "—",
            description: "Total sessions conducted"
        },
        {
            title: "Credit Transactions",
            value: "—",
            description: "Platform credit activity"
        }
    ];

    return (
        <div className="admin-page">

            <PageHeader
                title="Admin Overview"
                description="Monitor and manage the prabhavAI platform."
            />

            <div className="admin-metrics">
                {metrics.map((metric) => (
                    <Card key={metric.title}>
                        <p className="admin-metric-title">
                            {metric.title}
                        </p>

                        <h2>{metric.value}</h2>

                        <span>{metric.description}</span>
                    </Card>
                ))}
            </div>

            <Card className="admin-placeholder">
                <h3>Platform Management</h3>

                <p>
                    User management, transactions and platform
                    analytics will appear here when the admin APIs
                    are connected.
                </p>
            </Card>

        </div>
    );
}

export default AdminDashboard;
