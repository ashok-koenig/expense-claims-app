const ratesService = require('./rates.service');
const { approvalTierFor } = require('../models/claim.model');

/**
 * Works out the derived money fields of a claim: its USD equivalent and the approval tier that follows
 * from it. This is the single place those two values are produced, for both new and updated claims.
 *
 * @param {number} amount - Claim amount in `currency`.
 * @param {string} currency - Uppercase 3-letter currency code.
 * @returns {Promise<{amountUSD: number|null, approvalTier: ('auto'|'manager'|'finance')|null}>} Both null when the currency has no exchange rate.
 * @throws {Error} If the exchange-rates file cannot be read or is not valid JSON.
 */
async function valueInUsd(amount, currency) {
  const amountUSD = await ratesService.amountInUsd(amount, currency);
  return { amountUSD, approvalTier: approvalTierFor(amountUSD) };
}

module.exports = { valueInUsd };
