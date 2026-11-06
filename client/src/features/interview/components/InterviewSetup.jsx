
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
                        Start from your analyzed resume. Add a job match when you want the conversation tailored to a specific job post.
                    </p>
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
                        <label>Number of Questions</label>

                        <select
                            value={config.questionCount}
                            onChange={(e) =>
                                updateConfig(
                                    "questionCount",
                                    Number(e.target.value)
                                )
                            }
                        >
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={20}>20 Questions</option>
                        </select>
                    </div>

                </div>

                <div className="voice-session-note">
                    <span className="voice-session-icon" aria-hidden="true">⌁</span>
                    <div>
                        <strong>A voice-first interview, on your terms</strong>
                        <p>
                            Hear questions aloud and answer by speaking or typing. Microphone permission is requested only if you choose speech. Submitted transcripts are sent to the AI interviewer and saved to your account for feedback; this app does not store audio recordings.
                        </p>
                    </div>
                </div>

                <p className="interview-credit-cost">
                    This {config.questionCount}-question interview reserves{" "}
                    <strong>
                        {config.questionCount === 5 ? 30 : config.questionCount === 10 ? 50 : 85} credits
                    </strong>
                    . Unused credits are released if you finish early.
                </p>

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
