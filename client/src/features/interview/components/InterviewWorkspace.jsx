
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

const sampleQuestions = [
    "Tell me about yourself and your professional background.",
    "Explain a challenging technical problem you have solved.",
    "How do you approach debugging an unfamiliar application?",
    "Describe a situation where you worked under a tight deadline.",
    "Why do you want to work in this particular role?"
];

function InterviewWorkspace({
    config,
    questionIndex,
    answer,
    setAnswer,
    onNext,
    onPrevious,
    onFinish
}) {
    const question = sampleQuestions[
        questionIndex % sampleQuestions.length
    ];

    const progress =
        ((questionIndex + 1) / config.questionCount) * 100;

    return (
        <div className="interview-workspace">

            <div className="interview-session-header">
                <div>
                    <span className="interview-label">
                        MOCK INTERVIEW
                    </span>

                    <h2>{config.role}</h2>

                    <p>
                        {config.type} · {config.difficulty} · {config.experience}
                    </p>
                </div>

                <div className="question-counter">
                    Question {questionIndex + 1} of {config.questionCount}
                </div>
            </div>

            <div className="interview-progress">
                <div style={{ width: `${progress}%` }} />
            </div>

            <Card className="question-card">
                <div className="question-card-header">
                    <span>QUESTION {questionIndex + 1}</span>
                    <span>{config.difficulty}</span>
                </div>

                <h2>{question}</h2>

                <p>
                    Take your time and structure your answer clearly.
                    Support your response with relevant examples.
                </p>
            </Card>

            <Card className="answer-card">
                <div className="answer-heading">
                    <h3>Your Answer</h3>
                    <span>Text response</span>
                </div>

                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={9}
                />

                <p className="answer-hint">
                    Your response is currently stored in this browser session.
                </p>
            </Card>

            <div className="interview-controls">

                <Button
                    variant="secondary"
                    onClick={onPrevious}
                    disabled={questionIndex === 0}
                >
                    ← Previous
                </Button>

                {questionIndex === config.questionCount - 1 ? (
                    <Button onClick={onFinish}>
                        Finish Interview
                    </Button>
                ) : (
                    <Button onClick={onNext}>
                        Next Question →
                    </Button>
                )}

            </div>

        </div>
    );
}

export default InterviewWorkspace;
