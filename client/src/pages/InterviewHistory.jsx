
import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function InterviewHistory() {
    return (
        <div className="history-page">
            <PageHeader
                title="Interview History"
                description="Review your previous mock interviews and track your progress."
            />

            <Card className="history-empty">
                <div className="history-empty-icon">◷</div>

                <h2>No interviews yet</h2>

                <p>
                    Your completed mock interviews will appear here.
                    Start your first practice session to begin tracking
                    your performance.
                </p>

                <Button
                    onClick={() => {
                        window.location.href = "/mock-interview";
                    }}
                >
                    Start Mock Interview
                </Button>
            </Card>
        </div>
    );
}

export default InterviewHistory;
