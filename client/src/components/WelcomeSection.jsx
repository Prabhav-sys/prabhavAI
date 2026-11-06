

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
                    Build confidence, improve your skills and get interview-ready.
                </p>
            </div>

            <Link to={hasResume ? "/mock-interview" : "/resume-analysis"}>
                <Button>{hasResume ? "Start an Interview" : "Analyze your resume"}</Button>
            </Link>
        </section>
    );
}

export default WelcomeSection;
