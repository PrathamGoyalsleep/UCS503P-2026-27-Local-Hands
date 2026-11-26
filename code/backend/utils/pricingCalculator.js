/**
 * ServeConnect Standardized Pricing Calculator
 * 
 * Provides a single source of truth for pricing calculations across:
 * - Frontend booking modal
 * - Backend booking creation & validation
 * - Razorpay order creation
 * - Stripe payment intent creation
 * - Stored booking records
 */

function calculateBookingPrice({
    hourlyRate = 250,
    durationHours = 2,
    platformFee = 0,
    additionalCharges = 0,
    taxRate = 0
} = {}) {
    // Parse and sanitize inputs
    const rate = Math.max(0, Math.round(Number(hourlyRate) || 250));
    const duration = Math.max(0.5, Number(durationHours) || 2);
    
    // 1. Service Cost = Hourly Rate * Duration in Hours
    const serviceCost = Math.round(rate * duration);
    
    // 2. Platform Fee (Currently 0 under active platform promotion)
    const pFee = Math.max(0, Math.round(Number(platformFee) || 0));
    
    // 3. Additional Charges (Materials, custom additions - defaults to 0)
    const addCharges = Math.max(0, Math.round(Number(additionalCharges) || 0));
    
    // 4. Applicable Taxes (GST)
    const taxes = Math.round((serviceCost + pFee + addCharges) * (Number(taxRate) || 0));
    
    // 5. Total Payable = Service Cost + Platform Fee + Taxes + Additional Charges
    const totalAmount = serviceCost + pFee + taxes + addCharges;

    return {
        hourlyRate: rate,
        durationHours: duration,
        serviceCost,
        platformFee: pFee,
        taxes,
        additionalCharges: addCharges,
        totalAmount
    };
}

module.exports = {
    calculateBookingPrice
};
