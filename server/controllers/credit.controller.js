import {
    getCreditPricing,
    getCreditTransactionHistory,
    getCreditWallet
} from "../services/credit.service.js";

export const getCreditWalletController = async (req, res, next) => {
    try {
        const wallet = await getCreditWallet(req.auth.uid);
        return res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        next(error);
    }
};

export const getCreditPricingController = (req, res) => res.status(200).json({
    success: true,
    data: getCreditPricing()
});

export const getCreditTransactionsController = async (req, res, next) => {
    try {
        const transactions = await getCreditTransactionHistory(req.auth.uid);
        return res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};
