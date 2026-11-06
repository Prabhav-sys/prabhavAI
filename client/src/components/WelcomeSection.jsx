

import { Link } from "react-router-dom";
import Button from "./ui/Button";
function WelcomeSection({ name, hasResume }) {
    return (
        <section className="welcome-section">
            <div>
                <p className="welcome-eyebrow">YOUR INTERVIEW WORKSPACE</p>

                <h1>
                    Welcome back, {name || "there"}!
                </h1>

                <p>
                    {hasResume
                        ? "Set up a role-focused practice session from your analyzed resume. Job matching is optional."
                        : "Analyze a resume first, then set up a role-focused AI interview."}
                </p>
            </div>

            <Link to={hasResume ? "/mock-interview" : "/resume-analysis"}>
                <Button>{hasResume ? "Set up an Interview" : "Analyze your resume"}</Button>
            </Link>
        </section>
    );
}

export default WelcomeSection;
