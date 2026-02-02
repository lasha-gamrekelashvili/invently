/**
 * Centralized pricing configuration (all prices in GEL)
 */
export const PRICING = {
  SETUP_FEE: 1.0,
  MONTHLY_SUBSCRIPTION: 49.0,
};

/**
 * Adds months to a date safely, handling month-end edge cases
 */
export function addMonthsSafe(date, months) {
  const result = new Date(date);
  const dayOfMonth = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(dayOfMonth, lastDayOfMonth));

  return result;
}

/**
 * Calculates billing period dates from a start date
 */
export function calculateBillingPeriod(startDate = new Date()) {
  const periodStart = new Date(startDate);
  const nextBillingDate = addMonthsSafe(periodStart, 1);

  const periodEnd = new Date(nextBillingDate);
  periodEnd.setDate(periodEnd.getDate() - 1);

  return {
    periodStart,
    periodEnd,
    nextBillingDate,
  };
}

export default PRICING;
