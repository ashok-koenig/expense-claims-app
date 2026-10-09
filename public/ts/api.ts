import {
  isClaim,
  isConversionResult,
  isRecord,
  type Claim,
  type ClaimInput,
  type ConversionResult,
} from './types.js';

const BASE_URL = '/api/claims';
const CONVERT_URL = '/api/rates/convert';

/** Turns the API's `{ error: { message, details? } }` body into one readable line, or null. */
function describeError(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.error)) return null;
  const { message, details } = body.error;

  if (Array.isArray(details)) {
    const items: unknown[] = details;
    const messages = items
      .filter(isRecord)
      .map((detail) => detail.message)
      .filter((text): text is string => typeof text === 'string');
    if (messages.length > 0) return messages.join('. ');
  }
  return typeof message === 'string' ? message : null;
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return fallback; // Non-JSON error body.
  }
  return describeError(body) ?? fallback;
}

async function request(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

const unexpected = () => new Error('The server sent an unexpected response.');

export async function listClaims(): Promise<Claim[]> {
  const body = await request(BASE_URL);
  if (!Array.isArray(body)) throw unexpected();
  const items: unknown[] = body;
  if (!items.every(isClaim)) throw unexpected();
  return items;
}

export async function submitClaim(claim: ClaimInput): Promise<Claim> {
  const body = await request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claim),
  });
  if (!isClaim(body)) throw unexpected();
  return body;
}

export async function convertToUsd(amount: number, currency: string): Promise<ConversionResult> {
  const query = new URLSearchParams({ amount: String(amount), currency });
  const body = await request(`${CONVERT_URL}?${query}`);
  if (!isConversionResult(body)) throw unexpected();
  return body;
}
