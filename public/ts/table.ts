// DOM edge of the claims table: turns the rows from claimRows.ts into elements.

import { toClaimRows, type ClaimCell, type ClaimRow } from './claimRows.js';
import type { Claim } from './types.js';

function buildCell({ text, className }: ClaimCell): HTMLTableCellElement {
  const td = document.createElement('td');
  td.textContent = text;
  if (className === undefined) return td;
  td.className = className;
  return td;
}

function buildRow(row: ClaimRow): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.append(...row.map(buildCell));
  return tr;
}

export function renderClaims(tbody: HTMLTableSectionElement, claims: readonly Claim[]): void {
  tbody.replaceChildren(...toClaimRows(claims).map(buildRow));
}
