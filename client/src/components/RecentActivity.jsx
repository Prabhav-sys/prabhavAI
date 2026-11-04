import Card from "./ui/Card";
import { Link } from "react-router-dom";

function RecentActivity() {
    return (
        <section className="dashboard-section">
            <div className="section-heading activity-heading">
                <div>
                    <h2>Recent Activity</h2>
                    <p>Your latest learning and interview activity.</p>
                </div>

                <Link to="/interview-history">
                    View All
                </Link>
            </div>

            <Card className="activity-empty">
                <div className="empty-icon">◷</div>

                <h3>No activity yet</h3>

                <p>
                    Your resume analyses and interview sessions
                    will appear here.
                </p>
            </Card>
        </section>
    );
}

export default RecentActivity;
