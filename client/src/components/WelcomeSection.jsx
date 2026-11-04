

import Button from "./ui/Button";
import Card from "./ui/Card";
function WelcomeSection({ name }) {
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

            <Button onClick={() => window.location.href = "/mock-interview"}>
                Start an Interview
            </Button>
        </section>
    );
}

export default WelcomeSection;
