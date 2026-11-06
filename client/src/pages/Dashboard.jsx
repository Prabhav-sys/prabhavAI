
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import PageHeader from "../components/common/PageHeader";

import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import QuickActions from "../components/QuickActions";
import RecentActivity from "../components/RecentActivity";
import { getDashboardSummary } from "../services/dashboard.service";
import { updateCreditBalance } from "../features/auth/authSlice";

import "../index.css";

function Dashboard() {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isActive = true;
        getDashboardSummary()
            .then((data) => {
                if (isActive) {
                    setSummary(data);
                    dispatch(updateCreditBalance(data.metrics.availableCredits));
                }
            })
            .catch((requestError) => {
                if (isActive) {
                    setError(
                        requestError.response?.data?.message ||
                        "Your dashboard data could not be loaded."
                    );
                }
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });
        return () => {
            isActive = false;
        };
    }, [dispatch]);

    return (
        <div className="dashboard-page">

            <PageHeader
                title="Overview"
                description="Your personal interview preparation workspace."
            />

            <WelcomeSection
                name={user?.name?.split(" ")[0]}
                hasResume={(summary?.metrics?.analyzedResumeCount ?? 0) > 0}
            />

            <StatsCards
                credits={summary?.metrics?.availableCredits ?? user?.credits}
                metrics={summary?.metrics}
            />

            {error && (
                <div className="dashboard-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            )}

            <QuickActions />

            <section className="dashboard-section">
                <div className="section-heading">
                    <h2>Interview performance</h2>
                    <p>Your average report score by month, based on completed interviews.</p>
                </div>
                <div className="performance-card">
                    {loading ? (
                        <p className="performance-empty">Loading performance data…</p>
                    ) : summary?.interviewTrend?.length ? (
                        <div className="performance-chart" role="img" aria-label="Average interview score by month">
                            {summary.interviewTrend.map((month) => {
                                const height = `${Math.max(8, (month.averageScore / 5) * 100)}%`;
                                return (
                                    <div className="performance-month" key={`${month.year}-${month.month}`}>
                                        <strong>{month.averageScore.toFixed(1)}<small>/5</small></strong>
                                        <div className="performance-bar-track">
                                            <span style={{ height }} />
                                        </div>
                                        <span className="performance-month-label">
                                            {new Date(month.year, month.month - 1).toLocaleDateString(undefined, { month: "short" })}
                                        </span>
                                        <small>{month.interviews} {month.interviews === 1 ? "interview" : "interviews"}</small>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="performance-empty">
                            Complete an interview to see your score trend here. Your reports remain available in interview history.
                        </p>
                    )}
                </div>
            </section>

            <RecentActivity
                items={summary?.recentActivity || []}
                loading={loading}
            />

        </div>
    );
}

export default Dashboard;
