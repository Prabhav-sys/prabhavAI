import Card from "./ui/Card";
import { Link } from "react-router-dom";

const destinations = {
    resume: "/resume-analysis",
    "job-fit": "/job-matching",
    interview: "/interview-history",
    credit: "/credits"
};

function RecentActivity({ items = [], loading = false }) {
    return (
        <section className="dashboard-section">
            <div className="section-heading activity-heading">
                <div>
                    <h2>Recent Activity</h2>
                    <p>Your latest learning and interview activity.</p>
                </div>

                <Link to="/interview-history">
                    Interview history
                </Link>
            </div>

            {loading ? (
                <Card className="activity-empty" role="status">Loading your latest activity…</Card>
            ) : items.length === 0 ? (
                <Card className="activity-empty">
                    <div className="empty-icon">◷</div>
                    <h3>Your preparation starts with a resume</h3>
                    <p>Analyze your resume to create tailored interview context and build your preparation history.</p>
                    <Link to="/resume-analysis">Analyze a resume →</Link>
                </Card>
            ) : (
                <Card className="activity-list">
                    {items.map((item) => (
                        <Link className="activity-row" to={destinations[item.type] || "/dashboard"} key={item.id}>
                            <span className={`activity-type activity-type--${item.type}`}>
                                {item.type === "resume" ? "R" : item.type === "job-fit" ? "J" : item.type === "interview" ? "I" : "C"}
                            </span>
                            <span className="activity-copy">
                                <strong>{item.title}</strong>
                                <small>{item.detail}</small>
                            </span>
                            <time dateTime={item.date}>{new Date(item.date).toLocaleDateString()}</time>
                        </Link>
                    ))}
                </Card>
            )}
        </section>
    );
}

export default RecentActivity;
