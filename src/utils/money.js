// At most two decimal places, tolerant of floating-point noise (19.99 * 100 is not exact).
const hasMaxTwoDecimals = (amount) => Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6;

const roundMoney = (amount) => Math.round(amount * 100) / 100;

module.exports = { hasMaxTwoDecimals, roundMoney };
