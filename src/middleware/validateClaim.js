const HttpError = require('../utils/httpError');
const { CATEGORIES, PAYMENT_METHODS, NOTES_MAX_LENGTH } = require('../models/claim.model');
const { hasMaxTwoDecimals } = require('../utils/money');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Validates and normalizes the body for POST and PUT. Unknown fields are dropped, which includes
// amountUSD, approvalTier and status: they are derived or controlled server-side and never accepted
// from the client. A claim's status can only change through an approval flow (not yet built).
function validateClaim(req, res, next) {
  const body = req.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  if (!isNonEmptyString(body.employeeName)) fail('employeeName', 'employeeName is required');
  if (!isNonEmptyString(body.description)) fail('description', 'description is required');

  if (body.category === undefined) fail('category', 'category is required');
  else if (!CATEGORIES.includes(body.category)) {
    fail('category', `category must be one of: ${CATEGORIES.join(', ')}`);
  }

  // Optional: omitted, null, or blank all mean "no project code".
  if (body.projectCode !== undefined && body.projectCode !== null && typeof body.projectCode !== 'string') {
    fail('projectCode', 'projectCode must be a string');
  }

  // Optional: omitted, null, or blank all mean "no cost center".
  if (body.costCenter !== undefined && body.costCenter !== null && typeof body.costCenter !== 'string') {
    fail('costCenter', 'costCenter must be a string');
  }

  // Optional short note: omitted, null, or blank all mean "no notes".
  if (body.notes !== undefined && body.notes !== null) {
    if (typeof body.notes !== 'string') {
      fail('notes', 'notes must be a string');
    } else if (body.notes.trim().length > NOTES_MAX_LENGTH) {
      fail('notes', `notes must be at most ${NOTES_MAX_LENGTH} characters`);
    }
  }

  if (body.amount === undefined) fail('amount', 'amount is required');
  else if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
    fail('amount', 'amount must be a positive number');
  } else if (!hasMaxTwoDecimals(body.amount)) {
    fail('amount', 'amount must have at most two decimal places');
  }

  if (body.currency === undefined) fail('currency', 'currency is required');
  else if (typeof body.currency !== 'string' || !/^[A-Za-z]{3}$/.test(body.currency)) {
    fail('currency', 'currency must be a 3-letter code, e.g. USD');
  }

  if (body.expenseDate === undefined) fail('expenseDate', 'expenseDate is required');
  else if (!isValidDate(body.expenseDate)) {
    fail('expenseDate', 'expenseDate must be a valid date in YYYY-MM-DD format');
  }

  // Optional: omitted, null, or blank all mean "no payment method".
  if (body.paymentMethod !== undefined && body.paymentMethod !== null) {
    const method = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : body.paymentMethod;
    if (method !== '' && !PAYMENT_METHODS.includes(method)) {
      fail('paymentMethod', `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
    }
  }

  if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors);

  const projectCode = typeof body.projectCode === 'string' ? body.projectCode.trim() : '';
  const costCenter = typeof body.costCenter === 'string' ? body.costCenter.trim() : '';
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

  req.body = {
    employeeName: body.employeeName.trim(),
    description: body.description.trim(),
    category: body.category,
    projectCode: projectCode === '' ? null : projectCode,
    costCenter: costCenter === '' ? null : costCenter,
    notes: notes === '' ? null : notes,
    amount: body.amount,
    currency: body.currency.toUpperCase(),
    expenseDate: body.expenseDate,
    paymentMethod: paymentMethod === '' ? null : paymentMethod,
  };
  next();
}

module.exports = validateClaim;
