
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useNotification } from "../context/NotificationContext";

import {
    uploadResume,
    getMyResumes,
    reanalyzeResume
} from "../services/resume.service";
import { getCreditWallet } from "../services/credit.service";
import { updateCreditBalance } from "../features/auth/authSlice";

import "../features/resume/resume.css";

function ResumeAnalysis() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [file, setFile] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [result, setResult] = useState(null);
    const [targetRole, setTargetRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [reanalyzingId, setReanalyzingId] = useState("");
    const [progress, setProgress] = useState(0);

    const loadResumes = useCallback(() => getMyResumes(), []);

    const refreshCreditBalance = () => {
        getCreditWallet()
            .then((wallet) => dispatch(updateCreditBalance(wallet.balance)))
            .catch(() => {
                showNotification(
                    "Resume processing succeeded, but your credit balance could not refresh.",
                    "error"
                );
            });
    };

    useEffect(() => {
        let isActive = true;

        loadResumes()
            .then((data) => {
                if (isActive) setResumes(data);
            })
            .catch(() => {
                if (isActive) {
                    showNotification("Unable to load resumes.", "error");
                }
            });

        return () => {
            isActive = false;
        };
    }, [loadResumes, showNotification]);

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0];

        if (!selected) return;

        if (
            selected.type !== "application/pdf" ||
            !selected.name.toLowerCase().endsWith(".pdf")
        ) {
            showNotification("Please select a PDF file.", "error");
            return;
        }

        if (selected.size > 5 * 1024 * 1024) {
            showNotification("Maximum file size is 5 MB.", "error");
            return;
        }

        setFile(selected);
        setResult(null);
        setTargetRole("");
    };

    const handleUpload = async () => {
        if (!file) {
            showNotification("Select a resume first.", "error");
            return;
        }

        setLoading(true);
        setProgress(0);

        try {
            const data = await uploadResume(file, (event) => {
                if (event.total) {
                    setProgress(
                        Math.round((event.loaded / event.total) * 100)
                    );
                }
            });

            setResult(data);
            setFile(null);

            try {
                setResumes(await loadResumes());
            } catch {
                showNotification(
                    "Resume analyzed, but the resume list could not be refreshed.",
                    "error"
                );
            }

            showNotification(
                "Resume analyzed successfully.",
                "success"
            );
            refreshCreditBalance();

        } catch (error) {
            if (error.response?.data?.code === "INSUFFICIENT_CREDITS") {
                showNotification(
                    `Resume analysis needs ${error.response.data.requiredCredits} credits; you have ${error.response.data.availableCredits}.`,
                    "error"
                );
                navigate("/credits");
            } else {
                showNotification(
                    error.response?.data?.message ||
                    error.message ||
                    "Resume analysis failed.",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReanalyze = async (resume) => {
        setReanalyzingId(resume._id);
        try {
            const updated = await reanalyzeResume(resume._id);
            setResumes((previous) => previous.map((item) =>
                item._id === updated._id ? updated : item
            ));
            setResult(updated);
            showNotification("Resume re-analyzed successfully.", "success");
            refreshCreditBalance();
        } catch (error) {
            if (error.response?.data?.code === "INSUFFICIENT_CREDITS") {
                showNotification(
                    `Re-analysis needs ${error.response.data.requiredCredits} credits; you have ${error.response.data.availableCredits}.`,
                    "error"
                );
                navigate("/credits");
            } else {
                showNotification(
                    error.response?.data?.message || "Resume re-analysis failed. Reserved credits are refunded if AI processing fails.",
                    "error"
                );
            }
        } finally {
            setReanalyzingId("");
        }
    };

    return (
        <div className="resume-analysis-page">
            <PageHeader
                title="Resume Analysis"
                description="Build the candidate context used by your AI interviewer. Job fit is optional; the resume is the foundation."
            />

            <Card>
                <h3>Upload your resume</h3>
                <p className="resume-credit-note">
                    First analysis: 35 credits. Re-analysis: 20 credits. Failed AI processing is refunded.
                </p>

                <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={loading}
                />

                {file && (
                    <p>
                        Selected: {file.name}
                        {" "}({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                )}

                {loading && (
                    <p>Uploading and analyzing: {progress}%</p>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={!file || loading}
                >
                    {loading ? "Analyzing..." : "Analyze Resume"}
                </Button>
            </Card>

            {result?.analysis && (
                <Card>
                    <h3>AI Analysis Results</h3>

                    <section>
                        <h4>Summary</h4>
                        <p>{result.analysis.summary}</p>
                    </section>

                    <section>
                        <h4>Skills</h4>
                        <ul>
                            {(result.analysis.skills || []).map(
                                (skill, index) => (
                                    <li key={index}>
                                        {typeof skill === "string"
                                            ? skill
                                            : skill.name}
                                    </li>
                                )
                            )}
                        </ul>
                    </section>

                    <section>
                        <h4>Strengths</h4>
                        <ul>
                            {(result.analysis.strengths || []).map(
                                (item, index) => (
                                    <li key={index}>{item}</li>
                                )
                            )}
                        </ul>
                    </section>

                    <section>
                        <h4>Recommendations</h4>
                        <ul>
                            {(result.analysis.recommendations || []).map(
                                (item, index) => (
                                    <li key={index}>{item}</li>
                                )
                            )}
                        </ul>
                    </section>
                </Card>
            )}

            {result?.status === "COMPLETED" && (
                <Card>
                    <h3>Prepare for a target role</h3>
                    <p>
                        Generate interview questions grounded in this resume
                        and tailored to the role you want.
                    </p>
                    <label htmlFor="resume-target-role">Target job role</label>
                    <input
                        id="resume-target-role"
                        className="resume-role-input"
                        type="text"
                        value={targetRole}
                        maxLength={120}
                        onChange={(event) => setTargetRole(event.target.value)}
                        placeholder="e.g. Frontend Engineer"
                    />
                    <Button
                        disabled={targetRole.trim().length < 2}
                        onClick={() =>
                            navigate("/mock-interview", {
                                state: {
                                    resumeId: result._id,
                                    resumeName: result.originalName,
                                    role: targetRole.trim()
                                }
                            })
                        }
                    >
                        Create tailored interview
                    </Button>
                </Card>
            )}

            <Card>
                <h3>Previous resumes</h3>

                {resumes.length === 0 ? (
                    <p>No resumes uploaded yet.</p>
                ) : (
                    resumes.map((resume) => (
                        <div className="resume-history-row" key={resume._id}>
                            <div>
                                <strong>{resume.originalName}</strong>
                                <p>Status: {resume.status}</p>
                                <small>{new Date(resume.createdAt).toLocaleString()}</small>
                            </div>
                            {resume.status === "COMPLETED" && (
                                <div className="resume-history-actions">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleReanalyze(resume)}
                                        disabled={Boolean(reanalyzingId) || loading}
                                    >
                                        {reanalyzingId === resume._id ? "Re-analyzing…" : "Re-analyze · 20 credits"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => navigate("/job-matching", { state: { resumeId: resume._id } })}
                                    >
                                        Optional job fit
                                    </Button>
                                    <Button
                                        onClick={() => navigate("/mock-interview", {
                                            state: {
                                                resumeId: resume._id,
                                                resumeName: resume.originalName
                                            }
                                        })}
                                    >
                                        Start interview
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}

export default ResumeAnalysis;
