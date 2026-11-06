
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import { useNotification } from "../context/NotificationContext";
import {
    startInterviewSession,
    submitInterviewAnswer,
    abandonInterviewSession
} from "../services/interview.service";
import { getMyResumes } from "../services/resume.service";
import { getCreditWallet } from "../services/credit.service";
import { updateCreditBalance } from "../features/auth/authSlice";

import InterviewSetup from "../features/interview/components/InterviewSetup";
import InterviewWorkspace from "../features/interview/components/InterviewWorkspace";
import InterviewResults from "../features/interview/components/InterviewResults";

import "../features/interview/interview.css";

const initialConfig = {
    role: "",
    experience: "Fresher",
    type: "Technical",
    difficulty: "Medium",
    questionCount: 5,
    fullInterview: false,
    resumeId: "",
    jobMatchId: ""
};

function MockInterview() {
    const { showNotification } = useNotification();
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const navigationState = location.state || {};
    const [stage, setStage] = useState("setup");
    const [config, setConfig] = useState({
        ...initialConfig,
        role: typeof navigationState.role === "string"
            ? navigationState.role
            : "",
        resumeId: typeof navigationState.resumeId === "string"
            ? navigationState.resumeId
            : "",
        jobMatchId: typeof navigationState.jobMatchId === "string"
            ? navigationState.jobMatchId
            : ""
    });
    const [resumeName, setResumeName] = useState(
        typeof navigationState.resumeName === "string"
            ? navigationState.resumeName
            : ""
    );
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [codeLanguages, setCodeLanguages] = useState({});
    const [questions, setQuestions] = useState([]);
    const [evaluations, setEvaluations] = useState({});
    const [sessionId, setSessionId] = useState(null);
    const [sessionStartedAt, setSessionStartedAt] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resumes, setResumes] = useState([]);
    const [resumeLoading, setResumeLoading] = useState(true);

    const refreshCreditBalance = () => {
        getCreditWallet()
            .then((wallet) => dispatch(updateCreditBalance(wallet.balance)))
            .catch(() => {
                showNotification(
                    "The interview was updated, but your credit balance could not refresh.",
                    "error"
                );
            });
    };

    useEffect(() => {
        let isActive = true;
        getMyResumes()
            .then((items) => {
                if (!isActive) return;
                const completed = items.filter((item) => item.status === "COMPLETED");
                setResumes(completed);
                setConfig((previous) => ({
                    ...previous,
                    resumeId: previous.resumeId && completed.some(
                        (item) => item._id === previous.resumeId
                    )
                        ? previous.resumeId
                        : completed[0]?._id || ""
                }));
                setResumeName(
                    completed.find((item) => item._id === navigationState.resumeId)
                        ?.originalName || completed[0]?.originalName || ""
                );
            })
            .catch((error) => {
                if (isActive) {
                    showNotification(
                        error.response?.data?.message || "Unable to load your analyzed resumes.",
                        "error"
                    );
                }
            })
            .finally(() => {
                if (isActive) setResumeLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [navigationState.resumeId, showNotification]);

    const currentAnswer = answers[questionIndex] || "";

    const setCurrentAnswer = (value) => {
        setAnswers((previous) => ({
            ...previous,
            [questionIndex]: value
        }));
    };

    const startInterview = async () => {
        if (!config.role.trim()) return;

        setLoading(true);

        try {
            const result = await startInterviewSession(config);
            setSessionId(result.sessionId);
            setSessionStartedAt(result.startedAt);
            setQuestions([result.question]);
            setQuestionIndex(0);
            setAnswers({});
            setCodeLanguages({});
            setEvaluations({});
            setReport(null);
            setStage("workspace");
            refreshCreditBalance();
        } catch (error) {
            if (error.response?.data?.code === "INSUFFICIENT_CREDITS") {
                showNotification(
                    `This interview needs ${error.response.data.requiredCredits} credits; you have ${error.response.data.availableCredits}.`,
                    "error"
                );
                navigate("/credits");
                return;
            }
            showNotification(
                error.response?.data?.message ||
                "Unable to generate interview questions. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async ({ answerMode, codeLanguage } = {}) => {
        if (!sessionId || !currentAnswer.trim()) return;
        setLoading(true);
        try {
            const result = await submitInterviewAnswer(sessionId, currentAnswer, {
                answerMode,
                ...(codeLanguage ? { codeLanguage } : {})
            });
            const nextAnswers = {
                ...answers,
                [questionIndex]: currentAnswer.trim()
            };
            const nextEvaluations = {
                ...evaluations,
                [questionIndex]: result.evaluation
            };
            setAnswers(nextAnswers);
            if (codeLanguage) {
                setCodeLanguages((previous) => ({
                    ...previous,
                    [questionIndex]: codeLanguage
                }));
            }
            setEvaluations(nextEvaluations);

            if (result.completed) {
                setReport(result.report);
                setStage("results");
                refreshCreditBalance();
            } else {
                setQuestions((previous) => [...previous, result.nextQuestion]);
                setQuestionIndex(result.questionIndex);
            }
        } catch (error) {
            showNotification(
                error.response?.data?.message ||
                "Your answer could not be evaluated. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const endInterview = async () => {
        if (!sessionId || !window.confirm(
            config.fullInterview
                ? "End this interview? The 100-credit reservation is prorated by time; no credits are charged if you have not submitted an answer."
                : "End this interview? You’ll only be charged for completed responses."
        )) return;
        setLoading(true);
        try {
            const result = await abandonInterviewSession(sessionId);
            refreshCreditBalance();
            showNotification(
                result.chargedCredits
                    ? config.fullInterview
                        ? `Interview ended. ${result.chargedCredits} credits were charged based on elapsed time.`
                        : `Interview ended. ${result.chargedCredits} credits were used for completed answers.`
                    : "Interview ended. All reserved credits were released.",
                "success"
            );
            setSessionId(null);
            setSessionStartedAt(null);
            setStage("setup");
        } catch (error) {
            showNotification(
                error.response?.data?.message || "Unable to end this interview.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const restartInterview = () => {
        setConfig(initialConfig);
        setResumeName("");
        setQuestionIndex(0);
        setAnswers({});
        setCodeLanguages({});
        setEvaluations({});
        setQuestions([]);
        setSessionId(null);
        setSessionStartedAt(null);
        setReport(null);
        setStage("setup");
    };

    return (
        <div className="mock-interview-page">

            <PageHeader
                title="AI Interview"
                description="Follow the steps below to prepare a realistic interview tailored to your role and experience."
            />

            {stage === "setup" && (
                <InterviewSetup
                    config={config}
                    setConfig={setConfig}
                    onStart={startInterview}
                    loading={loading || resumeLoading}
                    resumes={resumes}
                    onResumeChange={(resumeId) => {
                        setConfig((previous) => ({
                            ...previous,
                            resumeId,
                            jobMatchId: previous.resumeId === resumeId
                                ? previous.jobMatchId
                                : ""
                        }));
                        setResumeName(
                            resumes.find((item) => item._id === resumeId)?.originalName || ""
                        );
                    }}
                    resumeName={resumeName}
                />
            )}

            {stage === "workspace" && (
                <InterviewWorkspace
                    key={questionIndex}
                    config={config}
                    startedAt={sessionStartedAt}
                    questions={questions}
                    questionIndex={questionIndex}
                    answer={currentAnswer}
                    setAnswer={setCurrentAnswer}
                    submitting={loading}
                    onSubmitAnswer={submitAnswer}
                    onAbandon={endInterview}
                />
            )}

            {stage === "results" && (
                <InterviewResults
                    config={config}
                    answers={answers}
                    codeLanguages={codeLanguages}
                    questions={questions}
                    evaluations={evaluations}
                    report={report}
                    onRestart={restartInterview}
                />
            )}

        </div>
    );
}

export default MockInterview;
