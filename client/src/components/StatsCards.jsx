
import Card from "./ui/Card";

function StatsCards({ credits }) {
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
            value: "—",
            description: "Your analysis history will appear here",
            symbol: "▤",
            color: "purple"
        },
        {
            title: "Interviews Completed",
            value: "—",
            description: "Your completed sessions will appear here",
            symbol: "◎",
            color: "green"
        },
        {
            title: "Average Interview Score",
            value: "—",
            description: "Available after your first evaluation",
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
