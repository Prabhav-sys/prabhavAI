import { useCallback, useEffect, useRef, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

const getSpeechRecognition = () => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const preferredVoice = (voices, language) => {
    const languagePrefix = language?.split("-")[0]?.toLowerCase();
    const localeVoices = voices.filter((voice) =>
        !languagePrefix || voice.lang.toLowerCase().startsWith(languagePrefix)
    );
    const voicePool = localeVoices.length ? localeVoices : voices;
    return voicePool.find((voice) =>
        /female|woman|girl|samantha|zira|susan|victoria|karen|aria|jenny|ava|tessa/i
            .test(voice.name)
    ) || voicePool[0] || null;
};

const codeLanguages = [
    ["python", "Python"],
    ["javascript", "JavaScript"],
    ["typescript", "TypeScript"],
    ["java", "Java"],
    ["cpp", "C++"],
    ["go", "Go"],
    ["sql", "SQL"]
];

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
    const voiceURIRef = useRef("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const [voiceMessage, setVoiceMessage] = useState("");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [availableVoices, setAvailableVoices] = useState(() =>
        typeof window !== "undefined" && window.speechSynthesis
            ? window.speechSynthesis.getVoices()
            : []
    );
    const [selectedVoiceURI, setSelectedVoiceURI] = useState(() =>
        preferredVoice(
            typeof window !== "undefined" && window.speechSynthesis
                ? window.speechSynthesis.getVoices()
                : [],
            typeof navigator !== "undefined" ? navigator.language : ""
        )?.voiceURI || ""
    );
    const [codeLanguage, setCodeLanguage] = useState(
        question.codeLanguage || "python"
    );
    const [voiceSupported] = useState(() => Boolean(getSpeechRecognition()));
    const isCodeQuestion = question.responseMode === "code";
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
        if (!window.speechSynthesis) return undefined;
        const updateVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
            setSelectedVoiceURI((current) => {
                if (current && voices.some((voice) => voice.voiceURI === current)) {
                    return current;
                }
                return preferredVoice(voices, navigator.language)?.voiceURI || "";
            });
        };
        window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
        return () => {
            window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
        };
    }, []);

    useEffect(() => {
        voiceURIRef.current = selectedVoiceURI;
    }, [selectedVoiceURI]);

    const speakQuestion = useCallback((text) => {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
            setVoiceMessage("Spoken questions are not supported in this browser. You can read the question on screen.");
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(
            (voice) => voice.voiceURI === voiceURIRef.current
        ) || preferredVoice(voices, navigator.language);
        utterance.rate = 1;
        utterance.pitch = 1;
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
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        const speechTimer = window.setTimeout(
            () => speakQuestion(question.question),
            0
        );
        return () => {
            window.clearTimeout(speechTimer);
            mountedRef.current = false;
            recognitionRef.current?.abort();
            window.speechSynthesis?.cancel();
        };
    }, [question.question, speakQuestion]);

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
                        onClick={() => {
                            if (isSpeaking) {
                                window.speechSynthesis?.cancel();
                                setIsSpeaking(false);
                            } else {
                                speakQuestion(question.question);
                            }
                        }}
                        aria-label="Play interview question aloud"
                    >
                        {isSpeaking ? "Stop question audio" : "▶  Replay question"}
                    </Button>

                    <Card className={`candidate-answer-card${isCodeQuestion ? " code-response-card" : ""}`}>
                        <div className="candidate-answer-heading">
                            <div>
                                <span className="answer-overline">
                                    {isCodeQuestion ? "CODING RESPONSE" : "YOUR SPOKEN RESPONSE"}
                                </span>
                                <h3>{isCodeQuestion ? "Write your solution" : "Answer the interviewer"}</h3>
                            </div>
                            {isCodeQuestion ? (
                                <label className="code-language-picker">
                                    <span>Language</span>
                                    <select
                                        value={codeLanguage}
                                        onChange={(event) => setCodeLanguage(event.target.value)}
                                    >
                                        {codeLanguages.map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <span className="transcript-indicator">
                                    <i className={isListening ? "status-live" : ""} />
                                    {isListening ? "Listening · editing paused" : "Voice transcript"}
                                </span>
                            )}
                        </div>
                        <label className="sr-only" htmlFor="interview-answer">
                            {isCodeQuestion ? "Your code solution" : "Your spoken interview answer"}
                        </label>
                        <textarea
                            id="interview-answer"
                            className={isCodeQuestion ? "code-editor" : ""}
                            value={`${answer}${!isCodeQuestion && interimTranscript ? `${answer && !/\s$/.test(answer) ? " " : ""}${interimTranscript}` : ""}`}
                            onChange={(event) => {
                                setAnswer(event.target.value);
                                answerAtStartRef.current = event.target.value;
                            }}
                            readOnly={!isCodeQuestion && voiceSupported}
                            spellCheck={!isCodeQuestion}
                            autoCapitalize={isCodeQuestion ? "off" : undefined}
                            autoCorrect={isCodeQuestion ? "off" : undefined}
                            placeholder={isCodeQuestion
                                ? "Write your solution here..."
                                : "Start speaking to answer. Your transcript will appear here."}
                            rows={isCodeQuestion ? 12 : 5}
                            aria-describedby={isCodeQuestion ? "code-response-note" : "voice-privacy-note"}
                        />
                        {isCodeQuestion ? (
                            <p className="code-response-note" id="code-response-note">
                                This is a coding round. Write your solution in {codeLanguages.find(([value]) => value === codeLanguage)?.[1] || codeLanguage}.
                            </p>
                        ) : (
                            <>
                                <div className="voice-privacy-note" id="voice-privacy-note">
                                    <span aria-hidden="true">i</span>
                                    Speak naturally; the browser transcribes your answer. Your transcript is sent for evaluation; audio is not recorded or sent to the AI service.
                                </div>
                                {!voiceSupported && (
                                    <p className="voice-feedback" role="status">
                                        Speech input is unavailable in this browser. You can type an answer as a fallback.
                                    </p>
                                )}
                                {availableVoices.length > 0 && (
                                    <label className="interviewer-voice-picker">
                                        <span>Interviewer voice · slower pace</span>
                                        <select
                                            value={selectedVoiceURI}
                                            onChange={(event) => setSelectedVoiceURI(event.target.value)}
                                        >
                                            {availableVoices.map((voice) => (
                                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                                    {voice.name} ({voice.lang})
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                            </>
                        )}
                        {voiceMessage && !isCodeQuestion && (
                            <p className={`voice-feedback${isListening ? " voice-feedback-live" : ""}`} role="status">
                                {voiceMessage}
                            </p>
                        )}
                        {!isCodeQuestion && (
                            <div className="voice-controls">
                                <Button
                                    onClick={toggleListening}
                                    disabled={!voiceSupported || submitting}
                                    className={`microphone-button${isListening ? " microphone-button-active" : ""}`}
                                    aria-pressed={isListening}
                                >
                                    <span aria-hidden="true">{isListening ? "■" : "●"}</span>
                                    {isListening ? "Stop speaking" : "Start speaking"}
                                </Button>
                                {isListening && (
                                    <span className="recording-caption"><i /> Listening to your answer</span>
                                )}
                            </div>
                        )}
                    </Card>

                    <div className="interview-room-controls">
                        <span className="room-saved-note">
                            {submitting
                                ? "Your interviewer is evaluating your response..."
                                : "Your interviewer adapts the next question to your answer."}
                        </span>
                        <Button
                            onClick={() => onSubmitAnswer({
                                answerMode: isCodeQuestion ? "code" : "voice",
                                ...(isCodeQuestion ? { codeLanguage } : {})
                            })}
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
