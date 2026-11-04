
import { Link } from "react-router-dom";
import Card from "./ui/Card";
const actions = [
    {
        title: "Analyze Resume",
        description: "Upload your resume and discover areas for improvement.",
        path: "/resume-analysis",
        symbol: "▤"
    },
    {
        title: "Start Mock Interview",
        description: "Practice answering questions in a simulated interview.",
        path: "/mock-interview",
        symbol: "◎"
    },
    {
        title: "View Interview History",
        description: "Review your previous interview sessions and feedback.",
        path: "/interview-history",
        symbol: "◷"
    }
];

function QuickActions() {
    return (
        <section className="dashboard-section">
            <div className="section-heading">
                <h2>Quick Actions</h2>
                <p>Choose what you want to work on today.</p>
            </div>

            <div className="quick-actions-grid">
                {actions.map((action) => (
                    <Card key={action.path} className="action-card">
                        <div className="action-symbol">
                            {action.symbol}
                        </div>

                        <h3>{action.title}</h3>

                        <p>{action.description}</p>

                        <Link to={action.path}>
                            Explore <span>→</span>
                        </Link>
                    </Card>
                ))}
            </div>
        </section>
    );
}

export default QuickActions;
