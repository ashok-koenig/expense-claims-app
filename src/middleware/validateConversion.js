const HttpError = require('../utils/httpError');
const { hasMaxTwoDecimals } = require('../utils/money');

// Validates ?amount=&currency= and puts the parsed values on res.locals.conversion.
function validateConversion(req, res, next) {
  const { amount: rawAmount, currency } = req.query;
  const errors = [];

  const amount = typeof rawAmount === 'string' && rawAmount.trim() !== '' ? Number(rawAmount) : NaN;
  if (rawAmount === undefined) {
    errors.push({ field: 'amount', message: 'amount is required' });
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'amount must be a positive number' });
  } else if (!hasMaxTwoDecimals(amount)) {
    errors.push({ field: 'amount', message: 'amount must have at most two decimal places' });
  }

  if (currency === undefined) {
    errors.push({ field: 'currency', message: 'currency is required' });
  } else if (typeof currency !== 'string' || !/^[A-Za-z]{3}$/.test(currency)) {
    errors.push({ field: 'currency', message: 'currency must be a 3-letter code, e.g. USD' });
  }

  if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors);

  res.locals.conversion = { amount, currency: currency.toUpperCase() };
  next();
}

module.exports = validateConversion;
