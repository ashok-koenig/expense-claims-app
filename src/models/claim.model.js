const { randomUUID } = require('node:crypto');

const CATEGORIES = ['travel', 'meals', 'lodging', 'supplies', 'other'];
const PAYMENT_METHODS = ['card', 'cash', 'bank transfer'];
const STATUSES = ['submitted', 'approved', 'rejected'];
const DEFAULT_STATUS = 'submitted';

// Notes are meant to be short; the form input (public/index.html) uses the same limit.
const NOTES_MAX_LENGTH = 200;

// Approval tiers, by amountUSD: auto < MANAGER_MIN <= manager < FINANCE_MIN <= finance.
const TIERS = ['auto', 'manager', 'finance'];
const MANAGER_MIN_USD = 100;
const FINANCE_MIN_USD = 500;

// null when there is no USD amount (unsupported currency): the claim can't be tiered.
function approvalTierFor(amountUSD) {
  if (amountUSD == null) return null;
  if (amountUSD >= FINANCE_MIN_USD) return 'finance';
  if (amountUSD >= MANAGER_MIN_USD) return 'manager';
  return 'auto';
}

// amountUSD and approvalTier are derived server-side (see services/valuation.service.js), never
// accepted from the client; both are null if the currency has no exchange rate.
function createClaim({
  employeeName,
  description,
  category,
  projectCode,
  costCenter,
  notes,
  amount,
  currency,
  amountUSD,
  approvalTier,
  expenseDate,
  paymentMethod,
  status,
}) {
  return {
    id: randomUUID(),
    employeeName,
    description,
    category,
    projectCode: projectCode ?? null,
    costCenter: costCenter ?? null,
    notes: notes ?? null,
    amount,
    currency,
    amountUSD: amountUSD ?? null,
    approvalTier: approvalTier ?? null,
    expenseDate,
    paymentMethod: paymentMethod ?? null,
    status: status ?? DEFAULT_STATUS,
  };
}

module.exports = {
  CATEGORIES,
  PAYMENT_METHODS,
  STATUSES,
  DEFAULT_STATUS,
  NOTES_MAX_LENGTH,
  TIERS,
  approvalTierFor,
  createClaim,
};
