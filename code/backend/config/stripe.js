const Stripe = require("stripe");

let stripeClient = null;
const demoIntents = new Map();

function isDemoStripeMode() {
    const key = process.env.STRIPE_SECRET_KEY || "";
    return !key || key.includes("mock") || key.includes("placeholder");
}

function createDemoStripeClient() {
    return {
        paymentIntents: {
            create: async (params) => {
                const id = `pi_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const intent = {
                    id,
                    client_secret: `${id}_secret_serveconnect_demo`,
                    amount: params.amount,
                    currency: params.currency || "inr",
                    status: "requires_payment_method",
                    description: params.description,
                    metadata: params.metadata || {},
                    payment_method_types: ["card"]
                };
                demoIntents.set(id, intent);
                return intent;
            },
            retrieve: async (id) => {
                if (demoIntents.has(id)) {
                    return demoIntents.get(id);
                }
                return {
                    id,
                    client_secret: `${id}_secret_serveconnect_demo`,
                    status: "requires_payment_method",
                    currency: "inr"
                };
            }
        },
        webhooks: {
            constructEvent: (rawPayload) => {
                return typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
            }
        }
    };
}

function getStripe() {
    if (isDemoStripeMode()) {
        return createDemoStripeClient();
    }

    if (!stripeClient) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2023-10-16"
        });
    }
    return stripeClient;
}

module.exports = { getStripe, isDemoStripeMode };
