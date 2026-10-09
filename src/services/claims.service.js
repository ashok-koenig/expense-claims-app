const HttpError = require('../utils/httpError');
const repository = require('../repositories/claims.repository');
const { createClaim, DEFAULT_STATUS } = require('../models/claim.model');
const { valueInUsd } = require('./valuation.service');

/**
 * @typedef {'travel'|'meals'|'lodging'|'supplies'|'other'} Category
 * @typedef {'card'|'cash'|'bank transfer'} PaymentMethod
 * @typedef {'submitted'|'approved'|'rejected'} Status
 * @typedef {'auto'|'manager'|'finance'} ApprovalTier
 *
 * @typedef {object} ClaimInput Validated, normalized client data (see middleware/validateClaim.js).
 * @property {string} employeeName
 * @property {string} description
 * @property {Category} category
 * @property {string|null} projectCode Optional project code; null when none was given.
 * @property {string|null} costCenter Optional cost center; null when none was given.
 * @property {string|null} notes Optional short note (at most 200 characters); null when none was given.
 * @property {number} amount Positive, at most two decimal places.
 * @property {string} currency Uppercase 3-letter code.
 * @property {string} expenseDate Calendar date in YYYY-MM-DD format.
 * @property {PaymentMethod|null} paymentMethod Optional; null when none was given.
 * @property {string|null} receiptRef Optional receipt number or document id (at most 100 characters); null when none was given.
 *
 * @typedef {object} Claim
 * @property {string} id
 * @property {string} employeeName
 * @property {string} description
 * @property {Category} category
 * @property {string|null} projectCode
 * @property {string|null} costCenter
 * @property {string|null} notes
 * @property {number} amount
 * @property {string} currency
 * @property {number|null} amountUSD Null when the currency has no exchange rate.
 * @property {ApprovalTier|null} approvalTier Null when amountUSD is null.
 * @property {string} expenseDate
 * @property {PaymentMethod|null} paymentMethod
 * @property {string|null} receiptRef
 * @property {Status} status
 */

/**
 * Lists every stored claim, in insertion order.
 *
 * @returns {Claim[]} All claims; an empty array when none exist.
 */
function list() {
  return repository.findAll();
}

/**
 * Looks up a single claim by its id.
 *
 * @param {string} id - Id of the claim to fetch.
 * @returns {Claim} The matching claim.
 * @throws {HttpError} 404 when no claim has this id.
 */
function get(id) {
  const claim = repository.findById(id);
  if (!claim) throw new HttpError(404, `Claim ${id} not found`);
  return claim;
}

/**
 * Stores a new claim, deriving its USD amount and approval tier from the exchange-rates file.
 *
 * @param {ClaimInput} data - Validated claim fields; any client-supplied amountUSD, approvalTier or status must already be stripped.
 * @returns {Promise<Claim>} The saved claim, with a generated id, always "submitted" status, and amountUSD/approvalTier set (both null if the currency has no rate).
 * @throws {Error} If the exchange-rates file cannot be read or is not valid JSON.
 */
async function submit(data) {
  const usd = await valueInUsd(data.amount, data.currency);
  return repository.save(createClaim({ ...data, ...usd, status: DEFAULT_STATUS }));
}

/**
 * Replaces a claim's editable fields and recomputes amountUSD and approvalTier so they match
 * the new amount and currency.
 *
 * @param {string} id - Id of the claim to update; the id itself never changes.
 * @param {ClaimInput} data - Validated replacement fields; the existing status is always kept.
 * @returns {Promise<Claim>} The updated claim.
 * @throws {HttpError} 404 when no claim has this id.
 * @throws {Error} If the exchange-rates file cannot be read or is not valid JSON.
 */
async function update(id, data) {
  const existing = get(id);
  const usd = await valueInUsd(data.amount, data.currency);
  return repository.save({
    ...existing,
    ...data,
    ...usd,
    status: existing.status,
    id: existing.id,
  });
}

/**
 * Permanently deletes a claim from storage.
 *
 * @param {string} id - Id of the claim to delete.
 * @returns {void}
 * @throws {HttpError} 404 when no claim has this id, so a repeated delete fails rather than succeeding silently.
 */
function remove(id) {
  get(id);
  repository.remove(id);
}

module.exports = { list, get, submit, update, remove };
