import { createHash, randomUUID } from "crypto";
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors.js";
import env from "../config/env.js";
import Resume from "../models/Resume.js";
import InterviewSession from "../models/InterviewSession.js";
import JobMatch from "../models/JobMatch.js";
import CreditReservation from "../models/CreditReservation.js";
import {
    calculateInterviewCharge,
    getFeatureCost,
    refundReservation,
    reserveCredits,
    settleReservation
} from "./credit.service.js";
import { searchResumeContext } from "./aiService.service.js";

const experienceLevels = {
    Fresher: "entry",
    Junior: "junior",
    "Mid-level": "mid",
    Senior: "senior"
};

const interviewTypes = {
    Technical: "technical",
    Behavioral: "behavioral",
    HR: "behavioral",
    Mixed: "mixed"
};
const FULL_INTERVIEW_MAX_DURATION_MS = 40 * 60 * 1000;

const walletIdempotencyKey = (firebaseUid, feature, requestKey) =>
    createHash("sha256")
        .update(`${firebaseUid}:${feature}:${requestKey}`)
        .digest("hex");

const mapQuestion = (question) => ({
    question: question.question,
    category: question.category,
    difficulty: question.difficulty,
    whatItAssesses: question.what_it_assesses,
    responseMode: question.response_mode || "voice",
    codeLanguage: question.code_language || null,
    evaluationCriteria: question.evaluation_criteria
});

const getResumeContext = async ({ firebaseUid, payload }) => {
    let resume;
    let resumeContext;

    if (payload.resumeId) {
        resume = await Resume.findOne({
            _id: payload.resumeId,
            firebaseUid
        }).lean();

        if (!resume) {
            throw new NotFoundError("Resume not found.");
        }

        if (resume.status !== "COMPLETED" || !resume.aiResumeId) {
            throw new AppError(
                "The selected resume is not ready for interview generation.",
                409
            );
        }

        const relevantChunks = await searchResumeContext({
            firebaseUid,
            resumeId: resume.aiResumeId,
            query: `Find resume experience, skills, projects, and achievements relevant to a ${payload.role} interview.`,
        });

        resumeContext = [
            resume.analysis ? JSON.stringify(resume.analysis) : "",
            ...relevantChunks
        ].filter(Boolean).join("\n\n").slice(0, 12000);
    }

    if (payload.jobMatchId) {
        const jobMatch = await JobMatch.findOne({
            _id: payload.jobMatchId,
            firebaseUid
        }).lean();
        if (!jobMatch) throw new NotFoundError("Job match report not found.");
        if (resume && !jobMatch.resumeId.equals(resume._id)) {
            throw new AppError("The job match does not belong to the selected resume.", 400);
        }
        resume = resume || await Resume.findOne({
            _id: jobMatch.resumeId,
            firebaseUid,
            status: "COMPLETED"
        }).lean();
        if (!resume) throw new NotFoundError("Resume not found for this job match.");
        resumeContext = [
            resumeContext,
            `Target job: ${jobMatch.jobTitle}${jobMatch.company ? ` at ${jobMatch.company}` : ""}`,
            `Job description: ${jobMatch.jobDescription}`,
            `Job fit analysis: ${jobMatch.analysis.overallAssessment}`,
            `Relevant role requirements: ${jobMatch.analysis.requirements
                .map((item) => `${item.requirement} (${item.status})`)
                .join("; ")}`
        ].filter(Boolean).join("\n\n").slice(0, 12000);
    }

    return { resume, resumeContext };
};

const callInterviewAI = async ({ firebaseUid, path, body }) => {
    let response;

    try {
        response = await fetch(
            `${env.aiServiceUrl}/api/v1/interviews/${path}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Internal-API-Key": env.aiServiceApiKey,
                    "X-User-ID": firebaseUid
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(180000)
            }
        );
    } catch (error) {
        const serviceError = new AppError(
            "AI interview service is unavailable.",
            502
        );
        serviceError.cause = error;
        throw serviceError;
    }

    let result;
    try {
        result = await response.json();
    } catch (error) {
        const serviceError = new AppError("AI interview service returned an invalid response.", 502);
        serviceError.cause = error;
        throw serviceError;
    }

    if (!response.ok) {
        throw new AppError("AI interview service could not process this turn.", 502);
    }

    return result;
};

const toAiConfig = (payload, resumeContext) => ({
    role: payload.role,
    experience_level: experienceLevels[payload.experience],
    interview_type: interviewTypes[payload.type],
    difficulty: payload.difficulty.toLowerCase(),
    question_count: payload.questionCount,
    ...(payload.fullInterview ? { full_interview: true } : {}),
    ...(resumeContext ? { resume_context: resumeContext } : {})
});

export const generateInterviewQuestions = async ({ firebaseUid, payload }) => {
    const { resume, resumeContext } = await getResumeContext({ firebaseUid, payload });
    const result = await callInterviewAI({
        firebaseUid,
        path: "questions",
        body: toAiConfig(payload, resumeContext)
    });

    if (!Array.isArray(result?.questions)) {
        throw new AppError("Interview question generation failed.", 502);
    }

    return {
        role: result.role,
        resumeId: resume?._id.toString() || null,
        questions: result.questions.map(mapQuestion)
    };
};

export const startInterviewSession = async ({
    firebaseUid,
    payload,
    requestKey = randomUUID()
}) => {
    const existing = await InterviewSession.findOne({ firebaseUid, idempotencyKey: requestKey });
    if (existing) {
        return {
            sessionId: existing.id,
            role: existing.role,
            questionCount: existing.questionCount,
            questionIndex: existing.turns.length - 1,
            question: existing.turns.at(-1).question,
            creditCost: existing.reservedCredits,
            startedAt: existing.createdAt,
            fullInterview: existing.fullInterview
        };
    }

    const { resume, resumeContext } = await getResumeContext({ firebaseUid, payload });
    const sessionId = new mongoose.Types.ObjectId();
    const reservedCredits = getFeatureCost(
        "INTERVIEW",
        payload.questionCount,
        payload.fullInterview
    );
    const reservation = await reserveCredits({
        firebaseUid,
        amount: reservedCredits,
        feature: "INTERVIEW",
        referenceId: sessionId.toString(),
        idempotencyKey: walletIdempotencyKey(firebaseUid, "INTERVIEW", requestKey),
        expiresInMinutes: 1440
    });

    try {
        const result = await callInterviewAI({
            firebaseUid,
            path: "sessions/start",
            body: toAiConfig(payload, resumeContext)
        });

        if (!result?.question) {
            throw new AppError("AI interview service did not return an opening question.", 502);
        }

        const session = await InterviewSession.create({
            _id: sessionId,
            firebaseUid,
            idempotencyKey: requestKey,
            role: payload.role,
            experience: payload.experience,
            type: payload.type,
            difficulty: payload.difficulty,
            questionCount: payload.questionCount,
            fullInterview: payload.fullInterview,
            resumeId: resume?._id || null,
            jobMatchId: payload.jobMatchId || null,
            creditReservationId: reservation._id,
            reservedCredits,
            turns: [{ question: mapQuestion(result.question) }]
        });

        return {
            sessionId: session.id,
            role: session.role,
            questionCount: session.questionCount,
            questionIndex: 0,
            question: session.turns[0].question,
            creditCost: reservedCredits,
            startedAt: session.createdAt,
            fullInterview: session.fullInterview
        };
    } catch (error) {
        await refundReservation({
            reservationId: reservation._id,
            description: "Interview could not be started; reserved credits refunded"
        });
        throw error;
    }
};

export const submitInterviewAnswer = async ({
    firebaseUid,
    sessionId,
    answer,
    answerMode = "voice",
    codeLanguage
}) => {
    const session = await InterviewSession.findOne({ _id: sessionId, firebaseUid });

    if (!session) {
        throw new NotFoundError("Interview session not found.");
    }
    if (session.status === "FAILED") {
        throw new ConflictError("This interview session ended after a service error.");
    }
    if (session.status === "ABANDONED") {
        throw new ConflictError("This interview session has been ended.");
    }
    if (session.status === "COMPLETED") {
        throw new ConflictError("This interview session has already been completed.");
    }

    const currentTurn = session.turns.at(-1);
    if (currentTurn?.answer) {
        return {
            completed: false,
            questionIndex: session.turns.length - 1,
            questionCount: session.questionCount,
            nextQuestion: session.turns.at(-1).question,
            evaluation: currentTurn.evaluation,
            report: null
        };
    }
    if (session.status !== "IN_PROGRESS") {
        throw new ConflictError("This interview session has already been completed.");
    }

    if (!currentTurn || currentTurn.answer) {
        throw new ConflictError("This interview turn has already been submitted.");
    }
    if (answerMode !== (currentTurn.question.responseMode || "voice")) {
        throw new BadRequestError("Answer using the response format requested for this question.");
    }
    if (answerMode === "code" && !codeLanguage) {
        throw new BadRequestError("Select a programming language for your code response.");
    }

    const { resumeContext } = session.resumeId || session.jobMatchId
        ? await getResumeContext({
            firebaseUid,
            payload: {
                resumeId: session.resumeId?.toString(),
                jobMatchId: session.jobMatchId?.toString(),
                role: session.role
            }
        })
        : { resumeContext: "" };

    const completedTurns = session.turns
        .slice(0, -1)
        .filter((turn) => turn.answer)
        .map((turn) => ({
            question: turn.question.question.slice(0, 600),
            category: turn.question.category,
            response_mode: turn.question.responseMode || "voice",
            answer: turn.answer.slice(-1000),
            previous_score: turn.evaluation?.score ?? null,
            previous_feedback: turn.evaluation?.feedback?.slice(0, 300) ?? null,
            answer_mode: turn.answerMode || "voice",
            code_language: turn.codeLanguage || null
        }));
    const completedCount = completedTurns.length + 1;
    const elapsedMs = Date.now() - session.createdAt.getTime();
    const turnPayload = {
        ...toAiConfig(session, resumeContext),
        completed_turns: completedTurns,
        current_question: {
            question: currentTurn.question.question,
            category: currentTurn.question.category,
            difficulty: currentTurn.question.difficulty.toLowerCase(),
            what_it_assesses: currentTurn.question.whatItAssesses || "",
            evaluation_criteria: currentTurn.question.evaluationCriteria || [],
            suggested_follow_up: null
        },
        answer,
        answer_mode: answerMode,
        code_language: answerMode === "code" ? codeLanguage : null,
        completed_count: completedCount,
        full_interview: session.fullInterview,
        elapsed_minutes: Math.min(elapsedMs / 60000, 40),
        time_limit_reached: session.fullInterview &&
            elapsedMs >= FULL_INTERVIEW_MAX_DURATION_MS
    };
    let result;
    try {
        result = await callInterviewAI({
            firebaseUid,
            path: "sessions/turn",
            body: turnPayload
        });
        if (
            session.fullInterview &&
            !result?.is_complete &&
            Date.now() - session.createdAt.getTime() >= FULL_INTERVIEW_MAX_DURATION_MS
        ) {
            result = await callInterviewAI({
                firebaseUid,
                path: "sessions/turn",
                body: {
                    ...turnPayload,
                    elapsed_minutes: 40,
                    time_limit_reached: true
                }
            });
        }
    } catch (error) {
        session.status = "FAILED";
        await session.save();
        await refundReservation({
            reservationId: session.creditReservationId,
            description: "AI interview service failed; reserved credits refunded"
        });
        throw error;
    }

    if (!result?.evaluation) {
        throw new AppError("AI interview service did not return an evaluation.", 502);
    }

    currentTurn.answer = answer;
    currentTurn.answerMode = answerMode;
    currentTurn.codeLanguage = answerMode === "code" ? codeLanguage || null : null;
    currentTurn.evaluation = {
        score: result.evaluation.score,
        feedback: result.evaluation.feedback,
        strengths: result.evaluation.strengths,
        improvements: result.evaluation.improvements
    };
    currentTurn.answeredAt = new Date();

    if (result.is_complete) {
        if (!result.final_report) {
            throw new AppError("AI interview service did not return a final report.", 502);
        }
        session.status = "COMPLETED";
        session.completedAt = new Date();
        session.report = {
            overallScore: result.final_report.overall_score,
            summary: result.final_report.summary,
            strengths: result.final_report.strengths,
            areasToImprove: result.final_report.areas_to_improve,
            recommendations: result.final_report.recommendations
        };
    } else {
        if (!result.next_question) {
            throw new AppError("AI interview service did not return the next question.", 502);
        }
        session.turns.push({ question: mapQuestion(result.next_question) });
    }

    try {
        await session.save();
    } catch (error) {
        if (error.name === "VersionError") {
            throw new ConflictError("This interview turn was already submitted.");
        }
        throw error;
    }

    if (session.status === "COMPLETED") {
        const capturedCredits = session.fullInterview
            ? session.reservedCredits
            : Math.ceil(session.reservedCredits * completedCount / session.questionCount);
        await settleReservation({
            reservationId: session.creditReservationId,
            capturedCredits,
            description: `Completed ${completedCount}-response ${session.type.toLowerCase()} interview`
        });
    }

    return {
        completed: session.status === "COMPLETED",
        questionIndex: session.turns.length - 1,
        questionCount: session.questionCount,
        nextQuestion: session.status === "COMPLETED"
            ? null
            : session.turns.at(-1).question,
        evaluation: currentTurn.evaluation,
        report: session.report,
        turns: session.turns.map((turn) => ({
            question: turn.question,
            answer: turn.answer,
            answerMode: turn.answerMode,
            codeLanguage: turn.codeLanguage,
            evaluation: turn.evaluation
        }))
    };
};

export const abandonInterviewSession = async ({ firebaseUid, sessionId }) => {
    const session = await InterviewSession.findOne({ _id: sessionId, firebaseUid });
    if (!session) throw new NotFoundError("Interview session not found.");
    if (session.status === "ABANDONED") {
        const reservation = await CreditReservation.findById(session.creditReservationId);
        return {
            status: session.status,
            answeredCount: session.turns.filter((turn) => turn.answer).length,
            chargedCredits: reservation?.capturedCredits ?? 0
        };
    }
    if (session.status !== "IN_PROGRESS") {
        throw new ConflictError("This interview session cannot be ended.");
    }

    const answeredCount = session.turns.filter((turn) => turn.answer).length;
    const elapsedMs = Math.max(0, Date.now() - session.createdAt.getTime());
    const chargedCredits = calculateInterviewCharge({
        reservedCredits: session.reservedCredits,
        answeredCount,
        questionCount: session.questionCount,
        fullInterview: session.fullInterview,
        elapsedMs,
        maxDurationMs: FULL_INTERVIEW_MAX_DURATION_MS
    });
    await settleReservation({
        reservationId: session.creditReservationId,
        capturedCredits: chargedCredits,
        description: answeredCount
            ? `Interview ended early after ${answeredCount} completed responses`
            : "Interview ended before answers; reserved credits released"
    });

    session.status = "ABANDONED";
    session.completedAt = new Date();
    await session.save();
    return { status: session.status, answeredCount, chargedCredits };
};

export const getCompletedInterviewSessions = async (firebaseUid) => {
    const sessions = await InterviewSession.find({
        firebaseUid,
        status: { $in: ["COMPLETED", "ABANDONED"] }
    })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("role type difficulty questionCount fullInterview turns report createdAt")
        .lean();

    return sessions.map((session) => ({
        id: session._id.toString(),
        role: session.role,
        type: session.type,
        difficulty: session.difficulty,
        questionCount: session.questionCount,
        fullInterview: session.fullInterview,
        answeredCount: session.turns.filter((turn) => turn.answer).length,
        status: session.status,
        overallScore: session.report?.overallScore ?? null,
        summary: session.report?.summary ?? "",
        createdAt: session.createdAt
    }));
};
