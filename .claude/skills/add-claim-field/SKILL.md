---
name: add-claim-field
description: Add a new attribute to expense claims consistently across the model, validation, README, OpenAPI spec, and the frontend table and form in one pass. Use whenever a new claim attribute or field is requested (e.g. "add a notes field", "track project code on claims", "claims need a receipt URL").
argument-hint: <fieldName> <type> [required|optional]
disable-model-invocation: true
context: fork
---

# Add a claim field

A claim field lives in several places that must change together (`CLAUDE.md`: never leave them partially
updated). Do all of it in one pass, then verify.

## 1. Pin down the field (ask only for what is missing)

| Input | Notes |
|---|---|
| **name** | camelCase, like the existing fields (`employeeName`, `expenseDate`) |
| **type** | `string`, `number`, `boolean`, `date` (YYYY-MM-DD), or an `enum` with its allowed values. Money amounts follow `CLAUDE.md`: a number with at most 2 decimals, currency a 3-letter ISO code |
| **required or optional** | Default to **optional** unless told otherwise. `PUT` replaces the whole claim, so a new required field makes every existing client's `POST` and `PUT` fail with a 400. Say so if the user asks for required |
| **source** | **Client-supplied** (form field, validated) or **server-derived** (like `amountUSD`, `approvalTier`: computed in the service, never accepted from the client, no form input) |
| **label / default** | Column and form label; default value if any (an optional field with no default is `null`/absent) |

If the field is server-derived, say where the derivation lives (a function in `src/services/`) and skip the
form and request-validation steps below, but still keep it out of `ClaimInput`.

## 2. Make the change everywhere, in the same position

Put the field in the **same position** in every list below (after the field it logically follows) so the
model, table columns, form order and docs all line up.

### Backend (layered; do not skip layers)
1. **Model**, `src/models/claim.model.js`: add the field to the `createClaim` parameters and returned object
   (apply the default there, e.g. `status ?? DEFAULT_STATUS`, `x ?? null`). For an enum, add a constant array
   (like `CATEGORIES`) and export it.
2. **Validation**, `src/middleware/validateClaim.js` (client-supplied only):
   - add the checks following the existing pattern (`if (body.x === undefined) fail(...) else if (...)` for
     required; skip when `undefined` for optional);
   - add the field, normalized (e.g. trimmed, uppercased), to the explicit `req.body = { ... }` whitelist at
     the bottom. Anything not listed there is dropped, so a forgotten field silently never reaches the service;
   - for an enum, validate with `X.includes(...)` and the message style `x must be one of: a, b, c`.
3. **Service**, `src/services/claims.service.js`: `submit` and `update` spread `...data`, so a client-supplied
   field needs no logic change. Update the `@typedef` `Claim` and `ClaimInput` blocks at the top of the file.
   A server-derived field is computed here or in a service it calls (see `valuation.service.js`) and spread
   into both `submit` and `update`.
4. The repository stores the whole object: no change.

### Frontend (TypeScript in `public/ts/`; `public/js/` is generated, never edit it)
5. **`types.ts`**: add the field to the `Claim` interface; add it to the `ClaimInput` `Pick` if client-supplied;
   for an enum add a `const X = [...] as const`, the derived type, and an `isX` guard; add the runtime check to
   `isClaim` (and `isConversionResult` if the convert endpoint returns it). The check must match the server's
   real JSON, including `null` for optional fields.
6. **`claimRows.ts`**: add the cell to `toClaimRow` at the right column position, with a small formatter if the
   display differs from the raw value (use the existing `NO_VALUE` for empty).
7. **`index.html`**: add the `<th>` in the same position as the cell, and for client-supplied fields a form
   control with a `name` equal to the field name (labelled, with the right `type`, `required` as appropriate).
8. **`main.ts`**: look the control up with `requireElement(form, '[name="x"]', HTMLInputElement)` (or
   `HTMLSelectElement`), read its value into the `ClaimInput` object, and clear/reset as the other fields do.
   For an enum select, narrow with the `isX` guard like `isCategory`.

   Hard rules (`CLAUDE.md`): no `any`, no `@ts-ignore`, no casts that only silence the compiler; check network
   data with the guards.

### Docs
9. **`README.md`**: the claim object table, the validation rules list, and every example response that shows a
   claim (list, get, submit, update); add the field to request examples where it is client-supplied.
10. **`docs/openapi.yaml`**: add the property to `Claim` (and to its `required` list when always present) and
    to `ClaimInput` (and its `required` list if the field is required), plus the examples. Use `readOnly: true`
    for server-derived fields.
11. **`CHANGELOG.md`**: add a line under an `Unreleased` heading (create it above the latest version if absent).

## 3. Verify (do not report done until these pass)

1. `npm run typecheck` and `npm run build` succeed.
2. Start a throwaway server on a spare port (`PORT=3123 node src/server.js`) and check with curl:
   - `POST /api/claims` with the field returns 201 and the field in the body;
   - an invalid value returns 400 with a `details` entry for this field (client-supplied only);
   - a missing value returns 400 if required, 201 with the default/`null` if optional;
   - `PUT /api/claims/:id` changes it, and `GET /api/claims/:id` and `GET /api/claims` include it;
   - a server-derived field is ignored when sent in the request body.
3. Stop the server. Confirm the table header and cell order match, and that the form control's `name` matches
   the field name.
4. Search the diff for `any`, `@ts-ignore` and casts.

## 4. Rules

- No new top-level directories; no new dependencies for a field.
- Keep the layering: no storage in controllers, no HTTP concerns in services.
- Do not commit unless asked. If asked, one commit titled for the feature (e.g. "feat: track project code on
  claims"), not the files.
- Existing in-memory claims need no migration; they disappear on restart.
- Finish with a short summary listing each file changed and any decision made (optional vs required, default,
  position).
