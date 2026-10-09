const HttpError = require('../utils/httpError');
const { roundMoney } = require('../utils/money');
const { approvalTierFor } = require('../models/claim.model');
const repository = require('../repositories/rates.repository');

async function findRate(currency) {
  const { rates } = await repository.load();
  return { rate: rates[currency], supported: Object.keys(rates) };
}

// Converts an amount in `currency` to USD using the rates file. Throws 404 if unsupported.
async function convert(amount, currency) {
  const { rate, supported } = await findRate(currency);
  if (rate === undefined) {
    throw new HttpError(
      404,
      `Currency ${currency} is not supported. Supported currencies: ${supported.join(', ')}`,
    );
  }
  const amountUSD = roundMoney(amount / rate);
  return { amount, currency, rate, amountUSD, approvalTier: approvalTierFor(amountUSD) };
}

// For claims: the USD amount, or null when the currency has no rate.
async function amountInUsd(amount, currency) {
  const { rate } = await findRate(currency);
  return rate === undefined ? null : roundMoney(amount / rate);
}

module.exports = { convert, amountInUsd };
