
import { useState } from "react";

import PageHeader from "../components/common/PageHeader";

import InterviewSetup from "../features/interview/components/InterviewSetup";
import InterviewWorkspace from "../features/interview/components/InterviewWorkspace";
import InterviewResults from "../features/interview/components/InterviewResults";

import "../features/interview/interview.css";

const initialConfig = {
    role: "",
    experience: "Fresher",
    type: "Technical",
    difficulty: "Medium",
    questionCount: 5
};

function MockInterview() {
    const [stage, setStage] = useState("setup");

    const [config, setConfig] = useState(initialConfig);

    const [questionIndex, setQuestionIndex] = useState(0);

    const [answers, setAnswers] = useState({});

    const currentAnswer = answers[questionIndex] || "";

    const setCurrentAnswer = (value) => {
        setAnswers((previous) => ({
            ...previous,
            [questionIndex]: value
        }));
    };

    const startInterview = () => {
        if (!config.role.trim()) return;

        setQuestionIndex(0);
        setAnswers({});
        setStage("workspace");
    };

    const finishInterview = () => {
        setStage("results");
    };

    const restartInterview = () => {
        setConfig(initialConfig);
        setQuestionIndex(0);
        setAnswers({});
        setStage("setup");
    };

    return (
        <div className="mock-interview-page">

            <PageHeader
                title="Mock Interview"
                description="Practice interviews and build confidence for your next opportunity."
            />

            {stage === "setup" && (
                <InterviewSetup
                    config={config}
                    setConfig={setConfig}
                    onStart={startInterview}
                />
            )}

            {stage === "workspace" && (
                <InterviewWorkspace
                    config={config}
                    questionIndex={questionIndex}
                    answer={currentAnswer}
                    setAnswer={setCurrentAnswer}
                    onPrevious={() =>
                        setQuestionIndex((previous) =>
                            Math.max(0, previous - 1)
                        )
                    }
                    onNext={() =>
                        setQuestionIndex((previous) =>
                            Math.min(config.questionCount - 1, previous + 1)
                        )
                    }
                    onFinish={finishInterview}
                />
            )}

            {stage === "results" && (
                <InterviewResults
                    config={config}
                    answers={answers}
                    onRestart={restartInterview}
                />
            )}

        </div>
    );
}

export default MockInterview;
