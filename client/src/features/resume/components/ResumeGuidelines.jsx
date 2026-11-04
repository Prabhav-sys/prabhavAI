
import Card from "../../../components/ui/Card";

function ResumeGuidelines() {
    const guidelines = [
        "Use a clear and professional resume format.",
        "Include relevant technical and professional skills.",
        "Highlight projects with measurable achievements.",
        "Keep your resume concise and well structured.",
        "Use readable fonts and consistent formatting."
    ];

    return (
        <Card className="resume-guidelines">
            <h3>Tips for better analysis</h3>

            <p>
                Follow these recommendations before uploading.
            </p>

            <ul>
                {guidelines.map((item, index) => (
                    <li key={index}>
                        <span>✓</span>
                        {item}
                    </li>
                ))}
            </ul>
        </Card>
    );
}

export default ResumeGuidelines;
