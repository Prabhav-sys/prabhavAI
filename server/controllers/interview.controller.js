import {
    generateInterviewQuestionsSchema,
    startInterviewSessionSchema,
    submitInterviewAnswerSchema
} from "../validators/interview.validation.js";
import {
    generateInterviewQuestions,
    startInterviewSession,
    submitInterviewAnswer,
    getCompletedInterviewSessions,
    abandonInterviewSession
} from "../services/interviewAI.service.js";

const validationError = (res, message, issues) => res.status(400).json({
    success: false,
    message,
    errors: issues
});

export const generateInterviewQuestionsController = async (req, res, next) => {
    const parsed = generateInterviewQuestionsSchema.safeParse(req.body);

    if (!parsed.success) {
        return validationError(res, "Invalid interview configuration.", parsed.error.issues);
    }

    try {
        const result = await generateInterviewQuestions({
            firebaseUid: req.auth.uid,
            payload: parsed.data
        });

        return res.status(200).json({
            success: true,
            message: "Interview questions generated successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const startInterviewSessionController = async (req, res, next) => {
    const parsed = startInterviewSessionSchema.safeParse(req.body);
    if (!parsed.success) {
        return validationError(res, "Invalid interview configuration.", parsed.error.issues);
    }

    try {
        const result = await startInterviewSession({
            firebaseUid: req.auth.uid,
            payload: parsed.data,
            requestKey: req.get("Idempotency-Key")
        });
        return res.status(201).json({
            success: true,
            message: "Interview session started.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const submitInterviewAnswerController = async (req, res, next) => {
    const parsed = submitInterviewAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
        return validationError(res, "Invalid interview answer.", parsed.error.issues);
    }

    try {
        const result = await submitInterviewAnswer({
            firebaseUid: req.auth.uid,
            sessionId: req.params.sessionId,
            answer: parsed.data.answer,
            answerMode: parsed.data.answerMode,
            codeLanguage: parsed.data.codeLanguage
        });
        return res.status(200).json({
            success: true,
            message: result.completed
                ? "Interview completed."
                : "Answer evaluated. Next question ready.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const abandonInterviewSessionController = async (req, res, next) => {
    try {
        const result = await abandonInterviewSession({
            firebaseUid: req.auth.uid,
            sessionId: req.params.sessionId
        });
        return res.status(200).json({
            success: true,
            message: "Interview session ended.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getInterviewHistoryController = async (req, res, next) => {
    try {
        const history = await getCompletedInterviewSessions(req.auth.uid);
        return res.status(200).json({
            success: true,
            message: "Interview history loaded.",
            data: history
        });
    } catch (error) {
        next(error);
    }
};
