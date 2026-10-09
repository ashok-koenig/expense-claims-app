import { convertToUsd, listClaims, submitClaim } from './api.js';
import { requireElement } from './dom.js';
import { tierLabel } from './claimRows.js';
import { renderClaims } from './table.js';
import { isCategory, isPaymentMethod, type ClaimInput } from './types.js';

const tbody = requireElement(document, '#claims-body', HTMLTableSectionElement);
const tableMessage = requireElement(document, '#table-message', HTMLElement);
const form = requireElement(document, '#claim-form', HTMLFormElement);
const formMessage = requireElement(document, '#form-message', HTMLElement);
const convertButton = requireElement(document, '#convert-btn', HTMLButtonElement);
const convertResult = requireElement(document, '#convert-result', HTMLElement);

const employeeNameInput = requireElement(form, '[name="employeeName"]', HTMLInputElement);
const descriptionInput = requireElement(form, '[name="description"]', HTMLInputElement);
const categoryInput = requireElement(form, '[name="category"]', HTMLSelectElement);
const projectCodeInput = requireElement(form, '[name="projectCode"]', HTMLInputElement);
const costCenterInput = requireElement(form, '[name="costCenter"]', HTMLInputElement);
const notesInput = requireElement(form, '[name="notes"]', HTMLInputElement);
const amountInput = requireElement(form, '[name="amount"]', HTMLInputElement);
const currencyInput = requireElement(form, '[name="currency"]', HTMLInputElement);
const expenseDateInput = requireElement(form, '[name="expenseDate"]', HTMLInputElement);
const paymentMethodInput = requireElement(form, '[name="paymentMethod"]', HTMLSelectElement);

const messageOf = (err: unknown): string => (err instanceof Error ? err.message : String(err));

async function refreshTable(): Promise<void> {
  try {
    const claims = await listClaims();
    renderClaims(tbody, claims);
    tableMessage.textContent = claims.length === 0 ? 'No claims yet.' : '';
  } catch (err) {
    tableMessage.textContent = `Could not load claims: ${messageOf(err)}`;
  }
}

convertButton.addEventListener('click', async () => {
  const amount = amountInput.valueAsNumber;
  const currency = currencyInput.value.trim();
  if (!(amount > 0)) {
    convertResult.textContent = 'Enter an amount greater than 0 to convert.';
    return;
  }
  if (!/^[A-Za-z]{3}$/.test(currency)) {
    convertResult.textContent = 'Enter a 3-letter currency code to convert.';
    return;
  }

  convertResult.textContent = 'Converting…';
  try {
    const result = await convertToUsd(amount, currency);
    convertResult.textContent =
      `${result.amount.toFixed(2)} ${result.currency} ≈ ${result.amountUSD.toFixed(2)} USD ` +
      `(rate: ${result.rate} ${result.currency} per 1 USD). Approval tier: ${tierLabel(result.approvalTier)}`;
  } catch (err) {
    convertResult.textContent = messageOf(err);
  }
});

// A shown conversion is stale once the amount or currency changes.
for (const input of [amountInput, currencyInput]) {
  input.addEventListener('input', () => {
    convertResult.textContent = '';
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  const category = categoryInput.value;
  if (!isCategory(category)) {
    formMessage.textContent = 'Choose a category.';
    return;
  }
  const paymentMethod = paymentMethodInput.value;
  const claim: ClaimInput = {
    employeeName: employeeNameInput.value,
    description: descriptionInput.value,
    category,
    projectCode: projectCodeInput.value.trim() || null,
    costCenter: costCenterInput.value.trim() || null,
    notes: notesInput.value.trim() || null,
    amount: amountInput.valueAsNumber,
    currency: currencyInput.value,
    expenseDate: expenseDateInput.value,
    paymentMethod: isPaymentMethod(paymentMethod) ? paymentMethod : null,
  };

  try {
    await submitClaim(claim);
    form.reset();
    convertResult.textContent = '';
    formMessage.textContent = 'Claim submitted.';
    await refreshTable();
  } catch (err) {
    formMessage.textContent = messageOf(err);
  }
});

void refreshTable();
