import InterviewSession from "../models/InterviewSession.js";
import JobMatch from "../models/JobMatch.js";
import Resume from "../models/Resume.js";
import CreditTransaction from "../models/CreditTransaction.js";
import { getCreditWallet } from "./credit.service.js";

export const getDashboardSummary = async (firebaseUid) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
        wallet,
        resumeCount,
        analyzedResumeCount,
        jobFitCount,
        completedInterviewCount,
        interviewCount,
        scoreSummary,
        interviewTrend,
        resumes,
        jobMatches,
        interviews,
        transactions
    ] = await Promise.all([
        getCreditWallet(firebaseUid),
        Resume.countDocuments({ firebaseUid }),
        Resume.countDocuments({ firebaseUid, status: "COMPLETED" }),
        JobMatch.countDocuments({ firebaseUid }),
        InterviewSession.countDocuments({ firebaseUid, status: "COMPLETED" }),
        InterviewSession.countDocuments({ firebaseUid }),
        InterviewSession.aggregate([
            {
                $match: {
                    firebaseUid,
                    status: "COMPLETED",
                    "report.overallScore": { $exists: true }
                }
            },
            { $group: { _id: null, averageScore: { $avg: "$report.overallScore" } } }
        ]),
        InterviewSession.aggregate([
            {
                $match: {
                    firebaseUid,
                    status: "COMPLETED",
                    completedAt: { $gte: sixMonthsAgo },
                    "report.overallScore": { $exists: true }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$completedAt" },
                        month: { $month: "$completedAt" }
                    },
                    averageScore: { $avg: "$report.overallScore" },
                    interviews: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        Resume.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("originalName status createdAt")
            .lean(),
        JobMatch.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("jobTitle company matchScore createdAt")
            .lean(),
        InterviewSession.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("role status report.overallScore createdAt completedAt")
            .lean(),
        CreditTransaction.find({ firebaseUid })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("type amount description createdAt")
            .lean()
    ]);

    const recentActivity = [
        ...resumes.map((resume) => ({
            id: `resume:${resume._id}`,
            type: "resume",
            title: resume.originalName,
            detail: resume.status === "COMPLETED" ? "Resume analyzed" : `Resume ${resume.status.toLowerCase()}`,
            date: resume.createdAt,
            status: resume.status
        })),
        ...jobMatches.map((match) => ({
            id: `job-fit:${match._id}`,
            type: "job-fit",
            title: match.jobTitle,
            detail: `${match.company ? `${match.company} · ` : ""}${match.matchScore}% fit`,
            date: match.createdAt
        })),
        ...interviews.map((interview) => ({
            id: `interview:${interview._id}`,
            type: "interview",
            title: `${interview.role} interview`,
            detail: interview.status === "COMPLETED"
                ? `Completed · Score ${interview.report?.overallScore ?? "—"}/5`
                : interview.status.replaceAll("_", " "),
            date: interview.completedAt || interview.createdAt,
            status: interview.status,
            score: interview.report?.overallScore ?? null
        })),
        ...transactions.map((transaction) => ({
            id: `credit:${transaction._id}`,
            type: "credit",
            title: transaction.description || "Credit activity",
            detail: `${transaction.type === "DEBIT" ? "−" : "+"}${Math.abs(transaction.amount)} credits`,
            date: transaction.createdAt
        }))
    ]
        .sort((first, second) => new Date(second.date) - new Date(first.date))
        .slice(0, 8);

    return {
        metrics: {
            availableCredits: wallet.balance,
            resumeCount,
            analyzedResumeCount,
            jobFitCount,
            completedInterviewCount,
            interviewCount,
            averageInterviewScore: scoreSummary[0]?.averageScore ?? null
        },
        interviewTrend: interviewTrend.map((item) => ({
            year: item._id.year,
            month: item._id.month,
            averageScore: Number(item.averageScore.toFixed(2)),
            interviews: item.interviews
        })),
        recentActivity
    };
};
