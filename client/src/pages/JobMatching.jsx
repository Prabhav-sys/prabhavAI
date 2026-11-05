
import { useEffect, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useNotification } from "../context/NotificationContext";

import { getMyResumes } from "../services/resume.service";
import {
    createJobMatch,
    getJobMatches
} from "../services/jobMatch.service";

function JobMatching() {
    const { showNotification } = useNotification();

    const [resumes, setResumes] = useState([]);
    const [history, setHistory] = useState([]);
    const [resumeId, setResumeId] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [company, setCompany] = useState("");
    const [jobDescription, setJobDescription] = useState("");

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resumeData, matchData] = await Promise.all([
                    getMyResumes(),
                    getJobMatches()
                ]);

                const completed = resumeData.filter(
                    (resume) => resume.status === "COMPLETED"
                );

                setResumes(completed);
                setHistory(matchData);

                if (completed.length) {
                    setResumeId(completed[0]._id);
                }
            } catch {
                showNotification("Unable to load matching data.", "error");
            }
        };

        loadData();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!resumeId) {
            showNotification("Upload and analyze a resume first.", "error");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const match = await createJobMatch({
                resumeId,
                jobTitle,
                company: company || null,
                jobDescription
            });

            setResult(match);
            setHistory((previous) => [match, ...previous]);

            showNotification("Job matching completed.", "success");
        } catch (error) {
            showNotification(
                error.response?.data?.message ||
                "Job matching failed. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="job-matching-page">
            <PageHeader
                title="Job Description Matching"
                subtitle="Evaluate how well your resume aligns with a job opportunity."
            />

            <Card>
                <form onSubmit={handleSubmit}>
                    <label>Choose analyzed resume</label>

                    <select
                        value={resumeId}
                        onChange={(event) => setResumeId(event.target.value)}
                        required
                    >
                        <option value="">Select resume</option>

                        {resumes.map((resume) => (
                            <option key={resume._id} value={resume._id}>
                                {resume.originalName}
                            </option>
                        ))}
                    </select>

                    <label>Job title</label>
                    <input
                        value={jobTitle}
                        onChange={(event) => setJobTitle(event.target.value)}
                        placeholder="e.g. AI Engineer"
                        minLength={2}
                        maxLength={160}
                        required
                    />

                    <label>Company (optional)</label>
                    <input
                        value={company}
                        onChange={(event) => setCompany(event.target.value)}
                        placeholder="Company name"
                        maxLength={160}
                    />

                    <label>Job description</label>
                    <textarea
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        placeholder="Paste the complete job description..."
                        minLength={100}
                        maxLength={20000}
                        rows={10}
                        required
                    />

                    <Button type="submit" disabled={loading || !resumes.length}>
                        {loading ? "Evaluating..." : "Analyze Job Match"}
                    </Button>

                    {!resumes.length && (
                        <p>Upload and analyze a resume before continuing.</p>
                    )}
                </form>
            </Card>

            {result && (
                <Card>
                    <h2>{result.jobTitle}</h2>
                    <p>{result.company || "Company not specified"}</p>

                    <h1>{result.matchScore}% Match</h1>

                    <p>
                        Required coverage: {result.requiredCoverage}%
                    </p>

                    <p>
                        Preferred coverage: {result.preferredCoverage}%
                    </p>

                    <h3>Overall assessment</h3>
                    <p>{result.analysis.overallAssessment}</p>

                    <h3>Requirement evaluation</h3>

                    {result.analysis.requirements.map((item, index) => (
                        <div key={index}>
                            <strong>{item.requirement}</strong>
                            <p>
                                {item.importance} · {item.status}
                            </p>
                            <p>{item.evidence}</p>
                            <hr />
                        </div>
                    ))}

                    <h3>Strengths</h3>
                    <ul>
                        {result.analysis.strengths.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>

                    <h3>Skill and experience gaps</h3>
                    <ul>
                        {result.analysis.gaps.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>

                    <h3>Recommendations</h3>
                    <ul>
                        {result.analysis.recommendations.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>

                    {result.analysis.caveats?.length > 0 && (
                        <>
                            <h3>Evaluation caveats</h3>
                            <ul>
                                {result.analysis.caveats.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </Card>
            )}

            <Card>
                <h3>Previous job matches</h3>

                {history.length === 0 ? (
                    <p>No matching reports yet.</p>
                ) : (
                    history.map((item) => (
                        <div key={item._id}>
                            <strong>{item.jobTitle}</strong>
                            <p>
                                {item.company || "Company not specified"} ·{" "}
                                {item.matchScore}% match
                            </p>
                            <small>
                                {new Date(item.createdAt).toLocaleString()}
                            </small>
                            <hr />
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}

export default JobMatching;
