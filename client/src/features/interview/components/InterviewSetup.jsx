
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

function InterviewSetup({
    config,
    setConfig,
    onStart,
    loading,
    resumeName,
    resumes,
    onResumeChange
}) {
    const updateConfig = (field, value) => {
        setConfig((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    return (
        <div className="interview-setup">

            <Card>
                <div className="interview-section-heading">
                    <span className="setup-eyebrow">YOUR NEXT PRACTICE SESSION</span>
                    <h2>Meet your AI interviewer</h2>
                    <p>
                        You’ll set up your interview here before it begins. An analyzed resume is required; adding a job match is optional.
                    </p>
                    <ol className="interview-setup-steps">
                        <li><strong>Select an analyzed resume</strong> to give the interviewer context about your experience.</li>
                        <li><strong>Optionally add a job match</strong> to tailor questions to a specific job description.</li>
                        <li><strong>Choose a role and interview settings</strong>, then prepare your session.</li>
                    </ol>
                    {resumeName && (
                        <p className="resume-context-note">
                            Resume context: <strong>{resumeName}</strong>. Questions will be tailored to the experience you shared.
                        </p>
                    )}
                </div>

                {!loading && resumes.length === 0 ? (
                    <div className="interview-resume-required">
                        <span aria-hidden="true">01</span>
                        <div>
                            <strong>Your resume is the interviewer's context</strong>
                            <p>Analyze a resume first so the AI can ground questions and follow-ups in your actual experience.</p>
                            <Link to="/resume-analysis"><Button>Analyze a resume →</Button></Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="interview-resume-select">
                            <label htmlFor="interview-resume">Interview from resume</label>
                            <select
                                id="interview-resume"
                                value={config.resumeId}
                                onChange={(event) => onResumeChange(event.target.value)}
                                disabled={loading}
                                required
                            >
                                {resumes.map((resume) => (
                                    <option key={resume._id} value={resume._id}>
                                        {resume.originalName}
                                    </option>
                                ))}
                            </select>
                            <span>
                                {config.jobMatchId
                                    ? "This interview also includes the selected job description."
                                    : "Job matching is optional; your resume is always used."}
                            </span>
                        </div>

                <div className="interview-form-grid">

                    <div className="interview-field">
                        <label>Job Role</label>

                        <input
                            value={config.role}
                            maxLength={120}
                            onChange={(e) =>
                                updateConfig("role", e.target.value)
                            }
                            placeholder="e.g. Software Engineer"
                        />
                    </div>

                    <div className="interview-field">
                        <label>Experience Level</label>

                        <select
                            value={config.experience}
                            onChange={(e) =>
                                updateConfig("experience", e.target.value)
                            }
                        >
                            <option value="Fresher">Fresher</option>
                            <option value="Junior">Junior (1–2 years)</option>
                            <option value="Mid-level">Mid-level (3–5 years)</option>
                            <option value="Senior">Senior (5+ years)</option>
                        </select>
                    </div>

                    <div className="interview-field">
                        <label>Interview Type</label>

                        <select
                            value={config.type}
                            onChange={(e) =>
                                updateConfig("type", e.target.value)
                            }
                        >
                            <option value="Technical">Technical</option>
                            <option value="Behavioral">Behavioral</option>
                            <option value="HR">HR Interview</option>
                            <option value="Mixed">Mixed Interview</option>
                        </select>
                    </div>

                    <div className="interview-field">
                        <label>Difficulty</label>

                        <select
                            value={config.difficulty}
                            onChange={(e) =>
                                updateConfig("difficulty", e.target.value)
                            }
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    <div className="interview-field">
                        <label htmlFor="interview-format">Interview Format</label>
                        <select
                            id="interview-format"
                            value={config.fullInterview ? "full" : "standard"}
                            onChange={(event) => {
                                const fullInterview = event.target.value === "full";
                                setConfig((previous) => ({
                                    ...previous,
                                    fullInterview
                                }));
                            }}
                        >
                            <option value="standard">Standard interview</option>
                            <option value="full">Full interview · 100 credits</option>
                        </select>
                    </div>

                    {!config.fullInterview && (
                        <div className="interview-field">
                            <label htmlFor="interview-question-count">Number of Questions</label>
                            <select
                                id="interview-question-count"
                                value={config.questionCount}
                                onChange={(event) =>
                                    updateConfig("questionCount", Number(event.target.value))
                                }
                            >
                                <option value={5}>5 Questions</option>
                                <option value={10}>10 Questions</option>
                                <option value={20}>20 Questions</option>
                            </select>
                        </div>
                    )}

                </div>

                {config.fullInterview && (
                    <div className="full-interview-note">
                        <strong>A rigorous, role-focused interview with no preset question count.</strong>
                        <p>
                            The interviewer will probe your answers and continue naturally, up to a 40-minute maximum. It costs 100 credits; ending early is prorated by time, with no charge before your first submitted answer.
                        </p>
                    </div>
                )}

                <div className="voice-session-note">
                    <span className="voice-session-icon" aria-hidden="true">⌁</span>
                    <div>
                        <strong>A voice-first interview, on your terms</strong>
                        <p>
                            Hear questions aloud and answer by speaking or typing. Microphone permission is requested only if you choose speech. Submitted transcripts are sent to the AI interviewer and saved to your account for feedback; this app does not store audio recordings.
                        </p>
                    </div>
                </div>

                {!config.fullInterview && (
                    <p className="interview-credit-cost">
                        This {config.questionCount}-question interview reserves{" "}
                        <strong>
                            {config.questionCount === 5 ? 30 : config.questionCount === 10 ? 50 : 85} credits
                        </strong>
                        . Unused credits are released if you finish early.
                    </p>
                )}

                <div className="interview-setup-footer">
                    <p>
                        You can pause, use text instead, or stop at any time.
                    </p>

                    <Button
                        onClick={onStart}
                        disabled={!config.role.trim() || !config.resumeId || loading}
                    >
                        {loading ? "Preparing your interview..." : "Prepare my interview →"}
                    </Button>
                </div>
                    </>
                )}
            </Card>

        </div>
    );
}

export default InterviewSetup;
