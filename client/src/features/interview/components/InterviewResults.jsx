
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

function InterviewResults({ config, answers, questions, evaluations, report, onRestart }) {
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
                        <strong>{report?.overallScore ?? "—"}/5</strong>
                        <span>Overall interview score</span>
                    </div>

                    <div>
                        <strong>{answeredCount}</strong>
                        <span>Questions discussed</span>
                    </div>

                    <div>
                        <strong>{config.experience}</strong>
                        <span>Interview level</span>
                    </div>
                </div>

                <Button onClick={onRestart}>
                    Start another interview
                </Button>
            </Card>

            {report && (
                <Card className="interview-report-card">
                    <span className="answer-overline">YOUR INTERVIEW REPORT</span>
                    <h3>Overall feedback</h3>
                    <p className="report-summary">{report.summary}</p>
                    <div className="report-columns">
                        <section>
                            <h4>What went well</h4>
                            <ul>
                                {report.strengths?.map((item, index) => (
                                    <li key={`strength-${index}`}>{item}</li>
                                ))}
                            </ul>
                        </section>
                        <section>
                            <h4>Areas to improve</h4>
                            <ul>
                                {report.areasToImprove?.map((item, index) => (
                                    <li key={`improve-${index}`}>{item}</li>
                                ))}
                            </ul>
                        </section>
                        <section>
                            <h4>Recommended next steps</h4>
                            <ul>
                                {report.recommendations?.map((item, index) => (
                                    <li key={`recommendation-${index}`}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </Card>
            )}

            <Card className="results-answers">
                <h3>Question-by-question feedback</h3>

                {questions.map((question, index) => (
                    <div className="response-item" key={index}>
                        <div className="response-title">
                            <strong>Question {index + 1}: {question.question}</strong>
                            {evaluations[index] && (
                                <span className="response-score">
                                    {evaluations[index].score}/5
                                </span>
                            )}
                        </div>

                        <p>
                            {answers[index]?.trim() || "No response provided."}
                        </p>
                        {evaluations[index] && (
                            <>
                                <p className="response-feedback">
                                    {evaluations[index].feedback}
                                </p>
                                {evaluations[index].improvements?.length > 0 && (
                                    <ul>
                                        {evaluations[index].improvements.map((item, itemIndex) => (
                                            <li key={itemIndex}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </Card>

        </div>
    );
}

export default InterviewResults;
