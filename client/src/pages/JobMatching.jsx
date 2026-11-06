import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useNotification } from "../context/NotificationContext";
import { getMyResumes } from "../services/resume.service";
import { getCreditWallet } from "../services/credit.service";
import { updateCreditBalance } from "../features/auth/authSlice";
import { createJobMatch, getJobMatch, getJobMatches } from "../services/jobMatch.service";
import "../features/job-matching/job-matching.css";

function JobMatching() {
    const { showNotification } = useNotification();
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const navigationState = location.state || {};
    const [resumes, setResumes] = useState([]);
    const [history, setHistory] = useState([]);
    const [resumeId, setResumeId] = useState(navigationState.resumeId || "");
    const [jobTitle, setJobTitle] = useState(navigationState.jobTitle || "");
    const [company, setCompany] = useState(navigationState.company || "");
    const [jobDescriptionPdf, setJobDescriptionPdf] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const refreshCreditBalance = () => {
        getCreditWallet()
            .then((wallet) => dispatch(updateCreditBalance(wallet.balance)))
            .catch(() => {
                showNotification(
                    "The job-fit report is ready, but your credit balance could not refresh.",
                    "error"
                );
            });
    };

    useEffect(() => {
        let isActive = true;
        Promise.all([getMyResumes(), getJobMatches()])
            .then(([resumeData, matchData]) => {
                if (!isActive) return;
                const completed = resumeData.filter((resume) => resume.status === "COMPLETED");
                setResumes(completed);
                setHistory(matchData);
                if (!navigationState.resumeId && completed[0]) {
                    setResumeId(completed[0]._id);
                }
            })
            .catch((error) => {
                if (isActive) {
                    showNotification(
                        error.response?.data?.message || "Unable to load job-fit data.",
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
    }, [navigationState.resumeId, showNotification]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!resumeId || !jobDescriptionPdf) return;
        setResult(null);
        setSubmitting(true);
        try {
            const match = await createJobMatch({
                resumeId,
                jobTitle: jobTitle.trim(),
                company: company.trim() || null,
                jobDescriptionPdf
            });
            setResult(match);
            setHistory((previous) => [
                match,
                ...previous.filter((item) => item._id !== match._id)
            ]);
            refreshCreditBalance();
            showNotification("Job fit report is ready.", "success");
        } catch (error) {
            if (error.response?.data?.code === "INSUFFICIENT_CREDITS") {
                showNotification(
                    `This job-fit analysis needs ${error.response.data.requiredCredits} credits; you have ${error.response.data.availableCredits}.`,
                    "error"
                );
                navigate("/credits");
            } else {
                showNotification(
                    error.response?.data?.message ||
                    "Job-fit analysis failed. No credits are charged for failed analysis.",
                    "error"
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleJobDescriptionChange = (event) => {
        setResult(null);
        const file = event.target.files?.[0] || null;
        if (!file) {
            setJobDescriptionPdf(null);
            return;
        }
        if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") {
            showNotification("Choose a PDF job description.", "error");
            event.target.value = "";
            setJobDescriptionPdf(null);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showNotification("The job-description PDF must be 5 MB or smaller.", "error");
            event.target.value = "";
            setJobDescriptionPdf(null);
            return;
        }
        setJobDescriptionPdf(file);
    };

    const openReport = async (matchId) => {
        try {
            setResult(await getJobMatch(matchId));
        } catch (error) {
            showNotification(
                error.response?.data?.message || "Unable to load this job-fit report.",
                "error"
            );
        }
    };

    const startInterview = () => {
        const resume = resumes.find((item) => item._id === result.resumeId);
        navigate("/mock-interview", {
            state: {
                role: result.jobTitle,
                resumeId: result.resumeId,
                resumeName: resume?.originalName || "",
                jobMatchId: result._id
            }
        });
    };

    return (
        <div className="job-fit-page">
            <PageHeader
                title="Job fit"
                description="Upload a job post and compare its requirements with evidence in your analyzed resume."
            />

            <div className="job-fit-purpose">
                <span className="job-fit-purpose-icon" aria-hidden="true">↗</span>
                <p>
                    <strong>Know your fit before you apply.</strong> Get an evidence-based match score,
                    see which requirements your resume demonstrates, and get practical edits to
                    strengthen your application without inventing experience.
                </p>
                <span className="job-fit-cost">15 credits per analysis</span>
            </div>

            {loading ? (
                <Card className="job-fit-empty">Loading your resumes and reports...</Card>
            ) : resumes.length === 0 ? (
                <Card className="job-fit-empty">
                    <span className="job-fit-empty-icon" aria-hidden="true">01</span>
                    <h2>Start with your resume</h2>
                    <p>Upload and analyze a resume first. Job fit uses its verified skills and experience as evidence.</p>
                    <Link to="/resume-analysis"><Button>Analyze my resume →</Button></Link>
                </Card>
            ) : (
                <div className="job-fit-grid">
                    <Card className="job-fit-form-card">
                        <div className="job-fit-step">
                            <span>OPTIONAL STEP</span>
                            <h2>Understand a target role</h2>
                            <p>Choose your analyzed resume, then upload the job description PDF.</p>
                        </div>
                        <form className="job-fit-form" onSubmit={handleSubmit}>
                            <label htmlFor="job-fit-resume">Resume to compare</label>
                            <select
                                id="job-fit-resume"
                                value={resumeId}
                                onChange={(event) => {
                                    setResumeId(event.target.value);
                                    setResult(null);
                                }}
                                required
                            >
                                {resumes.map((resume) => (
                                    <option key={resume._id} value={resume._id}>
                                        {resume.originalName}
                                    </option>
                                ))}
                            </select>

                            <div className="job-fit-form-row">
                                <div>
                                    <label htmlFor="job-fit-title">Role title</label>
                                    <input
                                        id="job-fit-title"
                                        value={jobTitle}
                                        onChange={(event) => {
                                            setJobTitle(event.target.value);
                                            setResult(null);
                                        }}
                                        placeholder="e.g. Product Engineer"
                                        minLength={2}
                                        maxLength={160}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="job-fit-company">Company <span>optional</span></label>
                                    <input
                                        id="job-fit-company"
                                        value={company}
                                        onChange={(event) => {
                                            setCompany(event.target.value);
                                            setResult(null);
                                        }}
                                        placeholder="Company name"
                                        maxLength={160}
                                    />
                                </div>
                            </div>

                            <label htmlFor="job-fit-description-pdf">Job description PDF</label>
                            <input
                                id="job-fit-description-pdf"
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleJobDescriptionChange}
                                required
                            />
                            <div className="job-fit-upload-note">
                                {jobDescriptionPdf
                                    ? `${jobDescriptionPdf.name} · ${(jobDescriptionPdf.size / 1024 / 1024).toFixed(2)} MB`
                                    : "PDF only · Up to 5 MB · Selectable text required. The file is processed temporarily and not stored."}
                            </div>
                            <Button type="submit" disabled={submitting || !resumeId || !jobDescriptionPdf}>
                                {submitting ? "Comparing your experience..." : "Analyze job fit · 15 credits"}
                            </Button>
                            <p className="job-fit-billing-note">
                                Your credits are reserved during analysis and charged only if the report succeeds.
                            </p>
                        </form>
                    </Card>

                    <div className="job-fit-report-column">
                        {result ? (
                            <Card className="job-fit-report">
                                <div className="job-fit-report-header">
                                    <div>
                                        <span className="job-fit-report-label">RESUME ↔ ROLE</span>
                                        <h2>{result.jobTitle}</h2>
                                        <p>
                                            {result.company || "Company not specified"}
                                            {result.createdAt && ` · Generated ${new Date(result.createdAt).toLocaleString()}`}
                                        </p>
                                    </div>
                                    <div className="job-fit-score">
                                        <strong>{result.matchScore}%</strong>
                                        <span>evidence fit</span>
                                    </div>
                                </div>
                                <p className="job-fit-assessment">{result.analysis?.overallAssessment}</p>
                                <div className="job-fit-coverage">
                                    <div>
                                        <span>Required coverage</span>
                                        <strong>{result.requiredCoverage}%</strong>
                                        <i><b style={{ width: `${result.requiredCoverage}%` }} /></i>
                                    </div>
                                    <div>
                                        <span>Preferred coverage</span>
                                        <strong>{result.preferredCoverage}%</strong>
                                        <i><b style={{ width: `${result.preferredCoverage}%` }} /></i>
                                    </div>
                                </div>
                                <div className="job-fit-report-section">
                                    <h3>Requirement evidence</h3>
                                    {result.analysis?.requirements?.map((item, index) => (
                                        <div className="job-fit-requirement" key={`${item.requirement}-${index}`}>
                                            <div>
                                                <strong>{item.requirement}</strong>
                                                <span className={`requirement-status status-${item.status}`}>
                                                    {item.status.replace("_", " ")}
                                                </span>
                                            </div>
                                            <p>{item.evidence || "No direct evidence found in this resume."}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="job-fit-report-section job-fit-gaps">
                                    <h3>Resume improvements for this role</h3>
                                    <p className="job-fit-resume-advice">
                                        Suggestions use evidence from your resume. Only add claims or metrics you can verify.
                                    </p>
                                    {(result.analysis?.gaps || []).map((item, index) => (
                                        <p key={index}><span aria-hidden="true">!</span>{item}</p>
                                    ))}
                                    {(result.analysis?.recommendations || []).slice(0, 3).map((item, index) => (
                                        <p key={`recommendation-${index}`}><span aria-hidden="true">↗</span>{item}</p>
                                    ))}
                                </div>
                                <Button onClick={startInterview}>
                                    Practice for this role →
                                </Button>
                                <p className="job-fit-interview-note">
                                    The interviewer will use both your resume and this job description as context.
                                </p>
                            </Card>
                        ) : (
                            <Card className="job-fit-placeholder">
                                <span aria-hidden="true">02</span>
                                <h2>Your fit report appears here</h2>
                                <p>We’ll compare requirements against evidence from the selected resume, then give you a direct path into a role-specific interview.</p>
                                <ol>
                                    <li><b>Match</b> — see supported skills and experience</li>
                                    <li><b>Spot gaps</b> — focus preparation where evidence is missing</li>
                                    <li><b>Practice</b> — start an interview grounded in the exact role</li>
                                </ol>
                            </Card>
                        )}

                        <Card className="job-fit-history">
                            <div className="job-fit-history-header">
                                <div>
                                    <span className="job-fit-report-label">YOUR PREVIOUS REPORTS</span>
                                    <h3>Job fit history</h3>
                                </div>
                                <span>{history.length}</span>
                            </div>
                            {history.length === 0 ? (
                                <p>Your completed job-fit reports will be saved here.</p>
                            ) : history.slice(0, 5).map((item) => (
                                <button
                                    className={`job-fit-history-item${result?._id === item._id ? " is-active" : ""}`}
                                    key={item._id}
                                    onClick={() => openReport(item._id)}
                                >
                                    <span>
                                        <strong>{item.jobTitle}</strong>
                                        <small>{item.company || "Role fit report"}</small>
                                    </span>
                                    <b>{item.matchScore}%</b>
                                </button>
                            ))}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

export default JobMatching;
