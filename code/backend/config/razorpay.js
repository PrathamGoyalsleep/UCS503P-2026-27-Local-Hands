const crypto = require("crypto");

function getRazorpayCredentials() {
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    return { keyId, keySecret };
}

function isRazorpayConfigured() {
    const { keyId, keySecret } = getRazorpayCredentials();
    return Boolean(keyId && keySecret && !keyId.includes("placeholder"));
}

/**
 * Creates an order directly via Razorpay REST API v1.
 * @param {Object} params - { amount (in paise), currency, receipt, notes }
 */
async function createRazorpayOrder({ amount, currency = "INR", receipt, notes = {} }) {
    const { keyId, keySecret } = getRazorpayCredentials();
    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing.");
    }

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader
        },
        body: JSON.stringify({
            amount,
            currency,
            receipt: receipt ? String(receipt).slice(0, 40) : undefined,
            notes
        })
    });

    const data = await response.json();
    if (!response.ok) {
        const errorDesc = data.error?.description || data.message || "Failed to create Razorpay order";
        throw new Error(`[Razorpay Error] ${errorDesc}`);
    }

    return data;
}

/**
 * Verifies Razorpay payment signature using HMAC SHA256.
 * @param {Object} params - { orderId, paymentId, signature }
 */
function verifyRazorpaySignature({ orderId, paymentId, signature }) {
    const { keySecret } = getRazorpayCredentials();
    if (!keySecret) {
        return false;
    }

    if (!orderId || !paymentId || !signature) {
        return false;
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(payload)
        .digest("hex");

    return expectedSignature === signature;
}

module.exports = {
    getRazorpayCredentials,
    isRazorpayConfigured,
    createRazorpayOrder,
    verifyRazorpaySignature
};
