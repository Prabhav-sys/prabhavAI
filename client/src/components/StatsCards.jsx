
import Card from "./ui/Card";

function StatsCards({ credits, metrics = {} }) {
    const stats = [
        {
            title: "Available Credits",
            value: credits ?? 0,
            description: "Credits available in your account",
            symbol: "✦",
            color: "blue"
        },
        {
            title: "Resume Analyses",
            value: metrics.analyzedResumeCount ?? "—",
            description: `${metrics.resumeCount ?? 0} resumes in your workspace`,
            symbol: "▤",
            color: "purple"
        },
        {
            title: "Interviews Completed",
            value: metrics.completedInterviewCount ?? "—",
            description: `${metrics.interviewCount ?? 0} total sessions`,
            symbol: "◎",
            color: "green"
        },
        {
            title: "Average Interview Score",
            value: metrics.averageInterviewScore == null
                ? "—"
                : `${metrics.averageInterviewScore.toFixed(1)}/5`,
            description: "Average score across completed interviews",
            symbol: "↗",
            color: "orange"
        }
    ];

    return (
        <section className="stats-grid">
            {stats.map((stat) => (
                <Card
                    key={stat.title}
                    className="stat-card"
                >
                    <div className="stat-card-top">
                        <span>{stat.title}</span>

                        <span className={`stat-icon ${stat.color}`}>
                            {stat.symbol}
                        </span>
                    </div>

                    <h2>{stat.value}</h2>

                    <p>{stat.description}</p>
                </Card>
            ))}
        </section>
    );
}

export default StatsCards;
