import InterviewSession from "../models/InterviewSession.js";
import JobMatch from "../models/JobMatch.js";
import Payment from "../models/Payment.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";

export const getAdminDashboardController = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [
            totalUsers,
            newUsers,
            totalResumes,
            totalJobFits,
            totalInterviews,
            completedInterviews,
            revenue,
            recentUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Resume.countDocuments(),
            JobMatch.countDocuments(),
            InterviewSession.countDocuments(),
            InterviewSession.countDocuments({ status: "COMPLETED" }),
            Payment.aggregate([
                { $match: { status: "PAID" } },
                {
                    $group: {
                        _id: null,
                        amountPaise: { $sum: "$amountPaise" },
                        purchases: { $sum: 1 }
                    }
                }
            ]),
            User.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select("name email role credits createdAt")
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            data: {
                metrics: {
                    totalUsers,
                    newUsersLast30Days: newUsers,
                    totalResumes,
                    totalJobFits,
                    totalInterviews,
                    completedInterviews,
                    verifiedRevenueInr: (revenue[0]?.amountPaise ?? 0) / 100,
                    verifiedPurchases: revenue[0]?.purchases ?? 0
                },
                recentUsers
            }
        });
    } catch (error) {
        next(error);
    }
};
