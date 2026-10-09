// Pure part of the claims table: turns claims into display text. No DOM access, so it can be
// tested in Node. table.ts is the edge that turns these rows into elements.

import type { ApprovalTier, Claim } from './types.js';

export interface ClaimCell {
  readonly text: string;
  /** CSS class for the cell, if any. */
  readonly className?: string;
}

/** One table row: cells in column order (matches the headers in index.html). */
export type ClaimRow = readonly ClaimCell[];

const NO_VALUE = '—';
const NUMERIC_CLASS = 'num';

const TIER_LABELS: Readonly<Record<ApprovalTier, string>> = {
  auto: 'Auto',
  manager: 'Manager',
  finance: 'Finance',
};

/** The API decides the tier; the frontend only maps it to a label (null = no USD amount to tier). */
export function tierLabel(tier: ApprovalTier | null): string {
  if (tier === null) return NO_VALUE;
  return TIER_LABELS[tier];
}

/** The USD equivalent as shown in the table (null = the currency has no exchange rate). */
export function formatUsd(amountUSD: number | null): string {
  if (amountUSD === null) return NO_VALUE;
  return `${amountUSD.toFixed(2)} USD`;
}

export function toClaimRow(claim: Claim): ClaimRow {
  return [
    { text: claim.employeeName },
    { text: claim.description },
    { text: claim.category },
    { text: claim.projectCode ?? NO_VALUE },
    { text: claim.costCenter ?? NO_VALUE },
    { text: claim.notes ?? NO_VALUE },
    { text: `${claim.amount.toFixed(2)} ${claim.currency}`, className: NUMERIC_CLASS },
    { text: formatUsd(claim.amountUSD), className: NUMERIC_CLASS },
    { text: tierLabel(claim.approvalTier) },
    { text: claim.expenseDate },
    { text: claim.paymentMethod ?? NO_VALUE },
    { text: claim.status },
  ];
}

export function toClaimRows(claims: readonly Claim[]): ClaimRow[] {
  return claims.map(toClaimRow);
}
