
import { Link } from "react-router-dom";
import Card from "./ui/Card";
const actions = [
    {
        title: "1. Analyze your resume",
        description: "Create your candidate profile and the context the AI interviewer will use.",
        path: "/resume-analysis",
        symbol: "▤"
    },
    {
        title: "2. Optional job fit",
        description: "Compare your resume with one job description to add role-specific interview context.",
        path: "/job-matching",
        symbol: "⌕"
    },
    {
        title: "3. Start an AI interview",
        description: "Practice by voice with adaptive questions grounded in your resume.",
        path: "/mock-interview",
        symbol: "◎"
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
