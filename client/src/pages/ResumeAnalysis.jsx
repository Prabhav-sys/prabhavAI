
import PageHeader from "../components/common/PageHeader";
import Card from "../components/ui/Card";

import ResumeUpload from "../features/resume/components/ResumeUpload";
import ResumeGuidelines from "../features/resume/components/ResumeGuidelines";
import ResumeResult from "../features/resume/components/ResumeResult";

import "../features/resume/resume.css";

function ResumeAnalysis() {
    return (
        <div className="resume-page">

            <PageHeader
                title="Resume Analysis"
                description="Get AI-powered insights to improve your resume and career opportunities."
            />

            <div className="resume-layout">

                <div className="resume-main-column">

                    <Card className="resume-upload-card">
                        <div className="resume-section-heading">
                            <h2>Upload your resume</h2>
                            <p>
                                Select your latest resume to get started.
                            </p>
                        </div>

                        <ResumeUpload />
                    </Card>

                    <ResumeResult />

                </div>

                <div className="resume-side-column">
                    <ResumeGuidelines />
                </div>

            </div>

        </div>
    );
}

export default ResumeAnalysis;
