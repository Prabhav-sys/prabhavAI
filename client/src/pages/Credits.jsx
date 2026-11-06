import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/ui/Button";
import PageHeader from "../components/common/PageHeader";
import { useNotification } from "../context/NotificationContext";
import { updateCreditBalance } from "../features/auth/authSlice";
import { getCreditPricing, getCreditWallet } from "../services/credit.service";
import {
    createPaymentOrder,
    getPaymentPackages,
    getPaymentHistory,
    verifyPayment
} from "../services/payment.service";
import "../features/credits/credits.css";

const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
        resolve();
        return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
    document.body.appendChild(script);
});

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
});

const transactionLabel = (transaction) => {
    if (transaction.type === "DEBIT") return transaction.feature?.replaceAll("_", " ") || "Usage";
    return transaction.description || transaction.type.replaceAll("_", " ");
};

function Credits() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const { showNotification } = useNotification();
    const [wallet, setWallet] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyPackage, setBusyPackage] = useState("");

    const loadWalletData = useCallback(async () => {
        const [walletResult, pricingResult, paymentResult, paymentHistory] = await Promise.all([
            getCreditWallet(),
            getCreditPricing(),
            getPaymentPackages(),
            getPaymentHistory()
        ]);
        setWallet(walletResult);
        setPricing(pricingResult);
        setPaymentConfig(paymentResult);
        setPayments(paymentHistory);
        dispatch(updateCreditBalance(walletResult.balance));
    }, [dispatch]);

    useEffect(() => {
        let isActive = true;
        Promise.all([
            getCreditWallet(),
            getCreditPricing(),
            getPaymentPackages(),
            getPaymentHistory()
        ])
            .then(([walletResult, pricingResult, paymentResult, paymentHistory]) => {
                if (!isActive) return;
                setWallet(walletResult);
                setPricing(pricingResult);
                setPaymentConfig(paymentResult);
                setPayments(paymentHistory);
                dispatch(updateCreditBalance(walletResult.balance));
            })
            .catch((error) => {
                if (isActive) {
                    showNotification(
                        error.response?.data?.message || "Unable to load your credits and billing details.",
                        "error"
                    );
                }
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });
        return () => {
            isActive = false;
        };
    }, [dispatch, showNotification]);

    const handlePurchase = async (packageId) => {
        setBusyPackage(packageId);
        try {
            if (!paymentConfig?.configured || !paymentConfig.keyId) {
                throw new Error("Razorpay is not configured. Add test-mode keys to the server environment to enable checkout.");
            }
            await loadRazorpay();
            const order = await createPaymentOrder(packageId);
            const checkout = new window.Razorpay({
                key: paymentConfig.keyId,
                amount: order.amountPaise,
                currency: order.currency,
                name: "prabhavAI",
                description: `${order.credits} interview preparation credits`,
                order_id: order.orderId,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || ""
                },
                theme: { color: "#635bff" },
                handler: async (response) => {
                    try {
                        const verification = await verifyPayment(response);
                        setWallet(verification.wallet);
                        setPayments(await getPaymentHistory());
                        if (user) {
                            dispatch(updateCreditBalance(verification.wallet.balance));
                        }
                        showNotification("Payment verified. Credits are now in your wallet.", "success");
                    } catch (error) {
                        const message = error.response?.data?.message ||
                            "Payment was submitted, but verification is pending. Your credits will appear after confirmation.";
                        let refreshFailed = false;
                        try {
                            await loadWalletData();
                        } catch {
                            refreshFailed = true;
                        }
                        showNotification(
                            refreshFailed
                                ? `${message} Wallet refresh also failed; reload this page to check the latest status.`
                                : message,
                            "error"
                        );
                    } finally {
                        setBusyPackage("");
                    }
                },
                modal: {
                    ondismiss: () => setBusyPackage("")
                }
            });
            checkout.on("payment.failed", (event) => {
                setBusyPackage("");
                showNotification(
                    event.error?.description || "Payment did not complete. You have not been charged for an unsuccessful payment.",
                    "error"
                );
            });
            checkout.open();
        } catch (error) {
            setBusyPackage("");
            showNotification(
                error.response?.data?.message || error.message || "Unable to start checkout.",
                "error"
            );
        }
    };

    return (
        <div className="credits-page">
            <PageHeader
                title="Credits & billing"
                description="Track usage, see what each preparation step costs, and add credits securely."
            />

            {loading ? (
                <div className="credits-loading" role="status">Loading your wallet…</div>
            ) : (
                <>
                    <section className="credits-balance-card">
                        <div>
                            <span className="credits-eyebrow">AVAILABLE BALANCE</span>
                            <strong>{wallet?.balance ?? 0}</strong>
                            <span>credits available</span>
                        </div>
                        <div className="credits-monthly-usage">
                            <span>This month</span>
                            <strong>{wallet?.creditsUsedThisMonth ?? 0} credits used</strong>
                            <a href="#credit-packages">Explore credit packages →</a>
                        </div>
                    </section>

                    <section className="credits-section">
                        <div className="credits-section-heading">
                            <div>
                                <span className="credits-eyebrow">PAY AS YOU PREPARE</span>
                                <h2>One clear cost for each step</h2>
                            </div>
                            <p>Reports, your profile, and your dashboard are always free.</p>
                        </div>
                        <div className="credits-cost-grid">
                            {[
                                ["Resume analysis", pricing?.features?.resumeAnalysis],
                                ["Re-analyze resume", pricing?.features?.resumeReanalysis],
                                ["Job fit for one posting", pricing?.features?.jobMatch],
                                ["5-question interview", pricing?.features?.interview?.[5]],
                                ["10-question interview", pricing?.features?.interview?.[10]],
                                ["20-question interview", pricing?.features?.interview?.[20]]
                            ].map(([label, amount]) => (
                                <div className="credits-cost-item" key={label}>
                                    <span>{label}</span>
                                    <strong>{amount ?? "—"} <small>credits</small></strong>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="credits-section" id="credit-packages">
                        <div className="credits-section-heading">
                            <div>
                                <span className="credits-eyebrow">ADD CREDITS</span>
                                <h2>Choose a package</h2>
                            </div>
                            <span className={`credits-mode ${paymentConfig?.mode === "test" ? "is-test" : ""}`}>
                                Razorpay {paymentConfig?.mode || "test"} mode
                            </span>
                        </div>
                        {!paymentConfig?.configured && (
                            <p className="credits-config-note">
                                Checkout is not enabled yet. The packages are visible, but server-side Razorpay test keys are required before purchase.
                            </p>
                        )}
                        <div className="credits-package-grid">
                            {(paymentConfig?.packages || pricing?.packages || []).map((item) => (
                                <article
                                    className={`credits-package-card ${item.popular ? "is-popular" : ""}`}
                                    key={item.id}
                                >
                                    {item.popular && <span className="credits-popular-tag">BEST VALUE</span>}
                                    <h3>{item.name}</h3>
                                    <strong className="credits-package-count">{item.credits.toLocaleString()}</strong>
                                    <span className="credits-package-unit">credits</span>
                                    <div className="credits-package-price">₹{item.priceInr}</div>
                                    <Button
                                        onClick={() => handlePurchase(item.id)}
                                        disabled={!paymentConfig?.configured || Boolean(busyPackage)}
                                    >
                                        {busyPackage === item.id ? "Opening checkout…" : "Buy credits"}
                                    </Button>
                                    <small>Purchased credits expire after 12 months.</small>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="credits-section credits-lots">
                        <div className="credits-section-heading">
                            <div>
                                <span className="credits-eyebrow">EXPIRATION</span>
                                <h2>Credit balances</h2>
                            </div>
                            <p>Credits with the nearest expiry are used first.</p>
                        </div>
                        {wallet?.lots?.length ? (
                            <div className="credits-table-wrap">
                                <table className="credits-table">
                                    <thead><tr><th>Source</th><th>Remaining</th><th>Expires</th></tr></thead>
                                    <tbody>
                                        {wallet.lots.map((lot) => (
                                            <tr key={lot._id}>
                                                <td>{lot.source === "WELCOME" ? "Welcome credits" : "Purchased credits"}</td>
                                                <td>{lot.remainingCredits}</td>
                                                <td>{formatDate(lot.expiresAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="credits-empty">No active credit lots. Add credits to continue preparing.</p>
                        )}
                    </section>

                    <section className="credits-section">
                        <div className="credits-section-heading">
                            <div>
                                <span className="credits-eyebrow">ACTIVITY</span>
                                <h2>Recent credit transactions</h2>
                            </div>
                        </div>
                        {wallet?.transactions?.length ? (
                            <div className="credits-table-wrap">
                                <table className="credits-table">
                                    <thead><tr><th>Activity</th><th>Credits</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {wallet.transactions.map((transaction) => (
                                            <tr key={transaction._id}>
                                                <td>{transactionLabel(transaction)}</td>
                                                <td className={transaction.amount < 0 || transaction.type === "DEBIT" ? "is-debit" : "is-credit"}>
                                                    {transaction.type === "DEBIT" ? "−" : "+"}{Math.abs(transaction.amount)}
                                                </td>
                                                <td>{formatDate(transaction.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="credits-empty">Your credit activity will appear here.</p>
                        )}
                    </section>

                    <section className="credits-section">
                        <div className="credits-section-heading">
                            <div>
                                <span className="credits-eyebrow">PAYMENT HISTORY</span>
                                <h2>Recent purchases</h2>
                            </div>
                        </div>
                        {payments.length ? (
                            <div className="credits-table-wrap">
                                <table className="credits-table">
                                    <thead><tr><th>Package</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment._id}>
                                                <td>{payment.packageId}</td>
                                                <td>₹{(payment.amountPaise / 100).toLocaleString()}</td>
                                                <td><span className={`payment-status status-${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                                                <td>{formatDate(payment.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="credits-empty">You have not purchased a credit package yet.</p>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default Credits;
