// The one place the frontend's data shapes are defined. Mirrors the API (see docs/openapi.yaml).

export const CATEGORIES = ['travel', 'meals', 'lodging', 'supplies', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_METHODS = ['card', 'cash', 'bank transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STATUSES = ['submitted', 'approved', 'rejected'] as const;
export type Status = (typeof STATUSES)[number];

export const APPROVAL_TIERS = ['auto', 'manager', 'finance'] as const;
export type ApprovalTier = (typeof APPROVAL_TIERS)[number];

export interface Claim {
  id: string;
  employeeName: string;
  description: string;
  category: Category;
  /** Optional project code; null when none was given. */
  projectCode: string | null;
  /** Optional cost center; null when none was given. */
  costCenter: string | null;
  /** Optional short note (at most 200 characters); null when none was given. */
  notes: string | null;
  amount: number;
  currency: string;
  /** Null when the currency has no exchange rate. */
  amountUSD: number | null;
  /** Null when there is no USD amount. */
  approvalTier: ApprovalTier | null;
  /** YYYY-MM-DD */
  expenseDate: string;
  /** Optional payment method; null when none was given. */
  paymentMethod: PaymentMethod | null;
  status: Status;
}

/** What the client sends to submit a claim; id, USD amount, tier and status are set by the server. */
export type ClaimInput = Pick<
  Claim,
  'employeeName' | 'description' | 'category' | 'projectCode' | 'costCenter' | 'notes' | 'amount' | 'currency' | 'expenseDate' | 'paymentMethod'
>;

export interface ConversionResult {
  amount: number;
  currency: string;
  /** Units of `currency` per 1 USD. */
  rate: number;
  amountUSD: number;
  approvalTier: ApprovalTier | null;
}

// Runtime checks for data that arrives from the network as `unknown`.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((category) => category === value);
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.some((method) => method === value);
}

function isStatus(value: unknown): value is Status {
  return STATUSES.some((status) => status === value);
}

function isApprovalTier(value: unknown): value is ApprovalTier {
  return APPROVAL_TIERS.some((tier) => tier === value);
}

const isNullableTier = (value: unknown): value is ApprovalTier | null =>
  value === null || isApprovalTier(value);

export function isClaim(value: unknown): value is Claim {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.employeeName === 'string' &&
    typeof value.description === 'string' &&
    isCategory(value.category) &&
    (value.projectCode === null || typeof value.projectCode === 'string') &&
    (value.costCenter === null || typeof value.costCenter === 'string') &&
    (value.notes === null || typeof value.notes === 'string') &&
    typeof value.amount === 'number' &&
    typeof value.currency === 'string' &&
    (value.amountUSD === null || typeof value.amountUSD === 'number') &&
    isNullableTier(value.approvalTier) &&
    typeof value.expenseDate === 'string' &&
    (value.paymentMethod === null || isPaymentMethod(value.paymentMethod)) &&
    isStatus(value.status)
  );
}

export function isConversionResult(value: unknown): value is ConversionResult {
  return (
    isRecord(value) &&
    typeof value.amount === 'number' &&
    typeof value.currency === 'string' &&
    typeof value.rate === 'number' &&
    typeof value.amountUSD === 'number' &&
    isNullableTier(value.approvalTier)
  );
}
