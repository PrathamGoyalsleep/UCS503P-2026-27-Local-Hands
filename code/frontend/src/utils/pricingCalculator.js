/**
 * ServeConnect Standardized Frontend Pricing Calculator
 * 
 * Provides consistent pricing calculation across all UI components:
 * serviceCost = hourlyRate * durationInHours
 * totalAmount = serviceCost + platformFee + taxes + additionalCharges
 */

export function calculatePricing({
  hourlyRate = 250,
  durationHours = 2,
  platformFee = 0,
  additionalCharges = 0,
  taxRate = 0
} = {}) {
  const rate = Math.max(0, Math.round(Number(hourlyRate) || 250));
  const duration = Math.max(0.5, Number(durationHours) || 2);
  
  // 1. Service Cost = Hourly Rate * Duration in Hours
  const serviceCost = Math.round(rate * duration);
  
  // 2. Platform Fee (Currently 0 for promotion)
  const pFee = Math.max(0, Math.round(Number(platformFee) || 0));
  
  // 3. Additional Charges
  const addCharges = Math.max(0, Math.round(Number(additionalCharges) || 0));
  
  // 4. Taxes / GST
  const taxes = Math.round((serviceCost + pFee + addCharges) * (Number(taxRate) || 0));
  
  // 5. Total Payable
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

export default calculatePricing;
