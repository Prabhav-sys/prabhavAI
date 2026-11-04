
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

function InterviewResults({ config, answers, onRestart }) {
    const answeredCount = Object.values(answers).filter(
        (answer) => answer.trim().length > 0
    ).length;

    return (
        <div className="interview-results">

            <Card className="results-header">
                <div className="results-success-icon">✓</div>

                <h2>Interview Completed!</h2>

                <p>
                    You've completed your {config.type.toLowerCase()} interview
                    practice session for {config.role}.
                </p>

                <div className="results-summary-grid">
                    <div>
                        <strong>{config.questionCount}</strong>
                        <span>Total Questions</span>
                    </div>

                    <div>
                        <strong>{answeredCount}</strong>
                        <span>Questions Answered</span>
                    </div>

                    <div>
                        <strong>{config.difficulty}</strong>
                        <span>Difficulty</span>
                    </div>
                </div>

                <p className="results-preview-note">
                    This is a session summary, not an AI evaluation.
                    Detailed scoring and feedback will be available
                    after the interview engine is integrated.
                </p>

                <Button onClick={onRestart}>
                    Start Another Interview
                </Button>
            </Card>

            <Card className="results-answers">
                <h3>Your Responses</h3>

                {Object.entries(answers).map(([index, answer]) => (
                    <div className="response-item" key={index}>
                        <strong>Question {Number(index) + 1}</strong>

                        <p>
                            {answer.trim() || "No response provided."}
                        </p>
                    </div>
                ))}
            </Card>

        </div>
    );
}

export default InterviewResults;
