import { useEffect, useRef, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

const getSpeechRecognition = () => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

function InterviewWorkspace({
    config,
    startedAt,
    questions,
    questionIndex,
    answer,
    setAnswer,
    submitting,
    onSubmitAnswer,
    onAbandon
}) {
    const question = questions[questionIndex];
    const recognitionRef = useRef(null);
    const mountedRef = useRef(true);
    const answerAtStartRef = useRef("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const [voiceMessage, setVoiceMessage] = useState("");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [voiceSupported] = useState(() => Boolean(getSpeechRecognition()));
    const progress = config.fullInterview
        ? Math.min((elapsedSeconds / (40 * 60)) * 100, 100)
        : ((questionIndex + 1) / config.questionCount) * 100;

    useEffect(() => {
        if (!config.fullInterview || !startedAt) return undefined;
        const updateElapsed = () => {
            setElapsedSeconds(Math.max(
                0,
                Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
            ));
        };
        updateElapsed();
        const timer = window.setInterval(updateElapsed, 1000);
        return () => window.clearInterval(timer);
    }, [config.fullInterview, startedAt]);

    const timeLimitReached = config.fullInterview && elapsedSeconds >= 40 * 60;
    const elapsedLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

    useEffect(() => {
        mountedRef.current = true;
        if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
            const utterance = new window.SpeechSynthesisUtterance(question.question);
            utterance.onstart = () => {
                if (mountedRef.current) setIsSpeaking(true);
            };
            utterance.onend = () => {
                if (mountedRef.current) setIsSpeaking(false);
            };
            window.speechSynthesis.speak(utterance);
        }
        return () => {
            mountedRef.current = false;
            recognitionRef.current?.abort();
            window.speechSynthesis?.cancel();
        };
    }, [question.question]);

    const speakQuestion = () => {
        if (isSpeaking) {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
            return;
        }

        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
            setVoiceMessage("Spoken questions are not supported in this browser. You can read the question and answer by text.");
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(question.question);
        utterance.onstart = () => {
            if (mountedRef.current) setIsSpeaking(true);
        };
        utterance.onend = () => {
            if (mountedRef.current) setIsSpeaking(false);
        };
        utterance.onerror = () => {
            if (mountedRef.current) {
                setIsSpeaking(false);
                setVoiceMessage("The question could not be played. You can continue by reading it on screen.");
            }
        };
        window.speechSynthesis.speak(utterance);
        setVoiceMessage("");
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        const SpeechRecognition = getSpeechRecognition();
        if (!SpeechRecognition) {
            setVoiceMessage("Speech input is unavailable in this browser. You can type your answer instead.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = navigator.language || "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        answerAtStartRef.current = answer.trim();

        recognition.onstart = () => {
            if (mountedRef.current) {
                setIsListening(true);
                setVoiceMessage("Listening. Your browser's speech recognition is active.");
            }
        };
        recognition.onresult = (event) => {
            if (!mountedRef.current) return;
            let finalTranscript = "";
            let interim = "";

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0].transcript;
                if (event.results[index].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (finalTranscript.trim()) {
                const prefix = answerAtStartRef.current;
                const separator = prefix && !/\s$/.test(prefix) ? " " : "";
                const nextAnswer = `${prefix}${separator}${finalTranscript.trim()}`.trim();
                setAnswer(nextAnswer);
                answerAtStartRef.current = nextAnswer;
            }
            setInterimTranscript(interim);
        };
        recognition.onerror = (event) => {
            if (!mountedRef.current) return;
            setIsListening(false);
            setInterimTranscript("");
            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                setVoiceMessage("Microphone access was blocked. Allow microphone access in your browser settings, or type your answer.");
            } else if (event.error === "no-speech") {
                setVoiceMessage("No speech was detected. Try again or type your answer.");
            } else if (event.error !== "aborted") {
                setVoiceMessage("Speech input stopped unexpectedly. You can retry or type your answer.");
            }
        };
        recognition.onend = () => {
            if (!mountedRef.current) return;
            setIsListening(false);
            setInterimTranscript("");
            setVoiceMessage((message) => message.startsWith("Listening.")
                ? "Speech capture stopped. Review your transcript, then continue."
                : message);
            if (recognitionRef.current === recognition) {
                recognitionRef.current = null;
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch {
            recognitionRef.current = null;
            setIsListening(false);
            setVoiceMessage("Could not start speech input. Check your browser microphone settings, or type your answer.");
        }
    };

    return (
        <main className="interview-room">
            <header className="interview-room-header">
                <div className="interview-room-brand">
                    <span className="interview-room-mark" aria-hidden="true">P</span>
                    <div>
                        <span className="interview-label">LIVE PRACTICE SESSION</span>
                        <h1>{config.role}</h1>
                        <p>{config.type} interview <span aria-hidden="true">·</span> {config.experience} <span aria-hidden="true">·</span> {config.difficulty}</p>
                    </div>
                </div>
                <div className="interview-room-progress">
                    <span>
                        {config.fullInterview
                            ? `${elapsedLabel} elapsed · 40:00 maximum`
                            : `QUESTION ${questionIndex + 1} OF UP TO ${config.questionCount}`}
                    </span>
                    <div
                        className="interview-progress"
                        role="progressbar"
                        aria-label="Interview progress"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={Math.round(progress)}
                    >
                        <div style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <Button
                    variant="secondary"
                    className="interview-end-button"
                    onClick={onAbandon}
                    disabled={submitting || isListening}
                >
                    End interview
                </Button>
            </header>

            {timeLimitReached && (
                <p className="full-interview-time-limit" role="status">
                    The 40-minute limit has been reached. Submit your current answer to receive your final evaluation, or end the interview now.
                </p>
            )}

            <div className="interview-room-body">
                <section className="interviewer-stage" aria-label="AI interviewer">
                    <div className={`interviewer-avatar${isSpeaking ? " is-speaking" : ""}`} aria-hidden="true">
                        <span>AI</span>
                        <i />
                    </div>
                    <span className="interviewer-name">Your AI interviewer</span>
                    <span className="interviewer-status">
                        <i className={isListening ? "status-live" : ""} />
                        {isListening
                            ? "Listening to your answer"
                            : submitting
                                ? "Considering your answer"
                                : isSpeaking
                                    ? "Asking the question"
                                    : "Ready when you are"}
                    </span>
                    <p className="interviewer-note">
                        Take a moment to think. Answer naturally, as you would in a real interview.
                    </p>
                </section>

                <section className="interview-conversation" aria-live="polite">
                    <div className="interview-question-meta">
                        <span>QUESTION {questionIndex + 1}</span>
                        {question.category && <span>{question.category}</span>}
                        <span>{question.difficulty || config.difficulty}</span>
                    </div>
                    <h2>{question.question}</h2>
                    <Button
                        variant="secondary"
                        className="question-audio-button"
                        onClick={speakQuestion}
                        aria-label="Play interview question aloud"
                    >
                        {isSpeaking ? "Stop question audio" : "▶  Replay question"}
                    </Button>

                    <Card className="candidate-answer-card">
                        <div className="candidate-answer-heading">
                            <div>
                                <span className="answer-overline">YOUR RESPONSE</span>
                                <h3>Answer the interviewer</h3>
                            </div>
                            <span className="transcript-indicator">
                                <i className={isListening ? "status-live" : ""} />
                                {isListening ? "Transcribing" : "Transcript"}
                            </span>
                        </div>
                        <label className="sr-only" htmlFor="interview-answer">
                            Your interview answer
                        </label>
                        <textarea
                            id="interview-answer"
                            value={`${answer}${interimTranscript ? `${answer && !/\s$/.test(answer) ? " " : ""}${interimTranscript}` : ""}`}
                            onChange={(event) => {
                                setAnswer(event.target.value);
                                answerAtStartRef.current = event.target.value;
                            }}
                            placeholder="Your spoken answer will appear here. You can also type your response."
                            rows={5}
                            aria-describedby="voice-privacy-note"
                        />
                        <div className="voice-privacy-note" id="voice-privacy-note">
                            <span aria-hidden="true">i</span>
                            Browser speech recognition may process audio through your browser provider. Submitted transcripts are sent to the AI interviewer and saved for your report; this app does not store audio recordings.
                        </div>
                        {voiceMessage && (
                            <p className={`voice-feedback${isListening ? " voice-feedback-live" : ""}`} role="status">
                                {voiceMessage}
                            </p>
                        )}
                        {!voiceSupported && (
                            <p className="voice-feedback" role="status">
                                Speech input is not supported in this browser. You can still complete the interview by typing.
                            </p>
                        )}
                        <div className="voice-controls">
                            <Button
                                onClick={toggleListening}
                                disabled={!voiceSupported}
                                className={`microphone-button${isListening ? " microphone-button-active" : ""}`}
                                aria-pressed={isListening}
                            >
                                <span aria-hidden="true">{isListening ? "■" : "●"}</span>
                                {isListening ? "Stop recording" : "Start speaking"}
                            </Button>
                            {isListening && (
                                <span className="recording-caption"><i /> Your answer is being captured</span>
                            )}
                        </div>
                    </Card>

                    <div className="interview-room-controls">
                        <span className="room-saved-note">
                            {submitting
                                ? "Your interviewer is evaluating your response..."
                                : "Your interviewer adapts the next question to your answer."}
                        </span>
                        <Button
                            onClick={onSubmitAnswer}
                            disabled={isListening || submitting || !answer.trim()}
                        >
                            {submitting
                                ? "Evaluating answer..."
                                : "Submit answer"}
                        </Button>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default InterviewWorkspace;
