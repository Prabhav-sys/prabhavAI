
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

function InterviewSetup({ config, setConfig, onStart }) {
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
                    <h2>Configure Your Interview</h2>
                    <p>
                        Customize your interview according to your career goals.
                    </p>
                </div>

                <div className="interview-form-grid">

                    <div className="interview-field">
                        <label>Job Role</label>

                        <input
                            value={config.role}
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
                            <option value={15}>15 Questions</option>
                        </select>
                    </div>

                </div>

                <div className="interview-setup-footer">
                    <p>
                        Your interview will be configured using these preferences.
                    </p>

                    <Button
                        onClick={onStart}
                        disabled={!config.role.trim()}
                    >
                        Start Mock Interview →
                    </Button>
                </div>
            </Card>

        </div>
    );
}

export default InterviewSetup;
