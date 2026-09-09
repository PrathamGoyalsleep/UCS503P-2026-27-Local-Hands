const twilio = require('twilio');

// Initialize Twilio client (requires credentials from .env)
// If credentials are not provided, it will mock the SMS for testing purposes
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

const sendSMS = async (toPhone, message) => {
    try {
        if (!client) {
            // Mock SMS if Twilio is not configured
            console.log(`\n[MOCK SMS] To: ${toPhone} | Message: "${message}"\n`);
            return { success: true, mocked: true };
        }

        // Add country code if missing (Assuming India +91 for this project based on 'Patiala' locations)
        let formattedPhone = toPhone;
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+91' + formattedPhone;
        }

        const response = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: formattedPhone
        });

        console.log(`SMS sent successfully to ${formattedPhone}. SID: ${response.sid}`);
        return { success: true, sid: response.sid };
    } catch (error) {
        console.error("Failed to send SMS:", error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendSMS };

