import { useEffect, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getAdminDashboard, getAdminUsers } from "../services/dashboard.service";
import "../features/dashboard/admin.css";

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
});

function AdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({ page: 1, totalUsers: 0, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isActive = true;
        Promise.all([
            getAdminDashboard(),
            getAdminUsers({ page, search: appliedSearch })
        ])
            .then(([dashboard, userResult]) => {
                if (!isActive) return;
                setMetrics(dashboard.metrics);
                setUsers(userResult.users);
                setMeta(userResult.meta);
                setError("");
            })
            .catch((requestError) => {
                if (isActive) {
                    setError(
                        requestError.response?.data?.message ||
                        "Unable to load platform analytics and user management."
                    );
                }
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });
        return () => {
            isActive = false;
        };
    }, [page, appliedSearch]);

    const metricsList = [
        ["Total users", metrics?.totalUsers, "Registered accounts"],
        ["New users", metrics?.newUsersLast30Days, "Joined in the last 30 days"],
        ["Completed interviews", metrics?.completedInterviews, `${metrics?.totalInterviews ?? 0} sessions total`],
        ["Verified revenue", metrics ? `₹${metrics.verifiedRevenueInr.toLocaleString()}` : "—", `${metrics?.verifiedPurchases ?? 0} verified purchases`],
        ["Resume analyses", metrics?.totalResumes, "Uploaded resume records"],
        ["Job-fit reports", metrics?.totalJobFits, "Role-specific comparisons"]
    ];

    return (
        <div className="admin-page">
            <PageHeader
                title="Admin overview"
                description="Monitor verified platform activity and manage user account visibility."
            />

            {error && <div className="admin-error" role="alert">{error}</div>}

            <div className="admin-metrics">
                {metricsList.map(([title, value, description]) => (
                    <Card key={title}>
                        <p className="admin-metric-title">{title}</p>
                        <h2>{loading && value == null ? "…" : value ?? 0}</h2>
                        <span>{description}</span>
                    </Card>
                ))}
            </div>

            <Card className="admin-user-card">
                <div className="admin-users-heading">
                    <div>
                        <h2>User management</h2>
                        <p>Search registered accounts and review their current roles and credit balances.</p>
                    </div>
                    <form
                        className="admin-search"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const nextSearch = search.trim();
                            if (nextSearch === appliedSearch && page === 1) return;
                            setLoading(true);
                            setPage(1);
                            setAppliedSearch(nextSearch);
                        }}
                    >
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name or email"
                            aria-label="Search users by name or email"
                        />
                        <Button type="submit" disabled={loading}>Search</Button>
                    </form>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-users-table">
                        <thead>
                            <tr><th>User</th><th>Email</th><th>Role</th><th>Credits</th><th>Joined</th></tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`admin-role admin-role--${user.role.toLowerCase()}`}>{user.role}</span></td>
                                    <td>{user.credits ?? 0}</td>
                                    <td>{formatDate(user.createdAt)}</td>
                                </tr>
                            ))}
                            {!loading && users.length === 0 && (
                                <tr><td className="admin-no-users" colSpan="5">No users match this search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <span>{meta.totalUsers ?? 0} accounts</span>
                    <div>
                        <Button
                            variant="secondary"
                            disabled={loading || page <= 1}
                            onClick={() => {
                                setLoading(true);
                                setPage((current) => Math.max(1, current - 1));
                            }}
                        >
                            Previous
                        </Button>
                        <span>Page {meta.page ?? page} of {meta.totalPages ?? 1}</span>
                        <Button
                            variant="secondary"
                            disabled={loading || page >= (meta.totalPages ?? 1)}
                            onClick={() => {
                                setLoading(true);
                                setPage((current) => current + 1);
                            }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default AdminDashboard;
