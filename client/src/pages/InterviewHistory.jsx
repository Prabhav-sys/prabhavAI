
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useNotification } from "../context/NotificationContext";
import { getInterviewHistory } from "../services/interview.service";

function InterviewHistory() {
    const { showNotification } = useNotification();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;
        getInterviewHistory()
            .then((items) => {
                if (isActive) setHistory(items);
            })
            .catch((error) => {
                if (isActive) {
                    showNotification(
                        error.response?.data?.message ||
                        "Unable to load interview history.",
                        "error"
                    );
                }
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [showNotification]);

    return (
        <div className="history-page">
            <PageHeader
                title="Interview History"
                description="Review your completed AI interviews and track your progress."
            />

            {loading ? (
                <Card className="history-empty">
                    <p>Loading your interview history...</p>
                </Card>
            ) : history.length === 0 ? (
                <Card className="history-empty">
                    <div className="history-empty-icon">◷</div>

                    <h2>No interviews yet</h2>

                    <p>
                        Your completed AI interview reports will appear here.
                    </p>

                    <Link to="/mock-interview">
                        <Button>Start an interview</Button>
                    </Link>
                </Card>
            ) : (
                <Card>
                    <h2>Recent interviews</h2>
                    {history.map((session) => (
                        <div key={session.id}>
                            <strong>{session.role}</strong>
                            <p>{session.type} · {session.difficulty} ·{" "}
                                {session.answeredCount} questions · Score {session.overallScore ?? "—"}/5
                            </p>
                            {session.summary && <p>{session.summary}</p>}
                            <small>
                                {new Date(session.createdAt).toLocaleString()}
                            </small>
                            <hr />
                        </div>
                    ))}
                </Card>
            )}
        </div>
    );
}

export default InterviewHistory;
