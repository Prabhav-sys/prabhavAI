
import { useEffect, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useNotification } from "../context/NotificationContext";

import {
    uploadResume,
    getMyResumes
} from "../services/resume.service";

function ResumeAnalysis() {
    const { showNotification } = useNotification();

    const [file, setFile] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const loadResumes = async () => {
        try {
            const data = await getMyResumes();
            setResumes(data);
        } catch {
            showNotification("Unable to load resumes.", "error");
        }
    };

    useEffect(() => {
        loadResumes();
    }, []);

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

            await loadResumes();

            showNotification(
                "Resume analyzed successfully.",
                "success"
            );

        } catch (error) {
            showNotification(
                error.response?.data?.message ||
                error.message ||
                "Resume analysis failed.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="resume-analysis-page">
            <PageHeader
                title="Resume Analysis"
                subtitle="Upload your resume and receive AI-powered feedback."
            />

            <Card>
                <h3>Upload your resume</h3>

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

            <Card>
                <h3>Previous resumes</h3>

                {resumes.length === 0 ? (
                    <p>No resumes uploaded yet.</p>
                ) : (
                    resumes.map((resume) => (
                        <div key={resume._id}>
                            <strong>{resume.originalName}</strong>
                            <p>Status: {resume.status}</p>
                            <small>
                                {new Date(resume.createdAt).toLocaleString()}
                            </small>
                            <hr />
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}

export default ResumeAnalysis;
