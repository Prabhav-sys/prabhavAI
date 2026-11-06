import { getDashboardSummary } from "../services/dashboard.service.js";

export const getDashboardSummaryController = async (req, res, next) => {
    try {
        const summary = await getDashboardSummary(req.auth.uid);
        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
};
