# Changelog

## [Unreleased]

### Added
- **Project code:** claims have an optional `projectCode`. It can be set when submitting or updating a claim (blank, `null` or omitted means none), is returned on every claim, and appears in the claims table and as a field on the submit form.
- **Cost center:** claims have an optional `costCenter`, with the same behavior as the project code (blank, `null` or omitted means none), shown in the table and on the submit form.
- **Notes:** claims have an optional short `notes` field (at most 200 characters; blank, `null` or omitted means none), shown in the table and on the submit form.
- **Payment method:** claims have an optional `paymentMethod` (`card`, `cash` or `bank transfer`; blank, `null` or omitted means none), shown in the table and on the submit form.

## [0.1.0] - 2026-10-09

Initial version.

### Added
- **Project skeleton:** Node 20+ / Express 5 backend with a layered structure (routes, controllers, services, repositories, models, middleware, utils), a plain HTML/CSS/JS frontend served from `public/`, `dev` / `start` / `test` scripts, and a `.env.example` (`PORT` only).
- **Expense claims API:** submit, list, fetch, update and delete claims (`/api/claims`). Claims are held in memory and reset when the server restarts.
- **Validation and errors:** required fields, a positive amount with at most two decimal places, a known category, a 3-letter currency, a real `YYYY-MM-DD` date, and a status that defaults to `submitted`. Every failure is returned as a consistent JSON error.
- **Claims frontend:** a claims table and a submit-claim form that refreshes the table.
- **USD conversion:** exchange rates are read from `data/exchange-rates.json` (USD, EUR, GBP, INR, SGD). `GET /api/rates/convert` returns the rate used and the USD amount rounded to two decimals, or a 404 listing the supported currencies. Each claim stores its `amountUSD` on submit and refreshes it on update; claims in a currency with no rate have a `null` USD amount. The table shows the USD equivalent, and the form has a Convert button that previews the conversion.
- **Approval tiers:** each claim has a server-derived `approvalTier` based on its USD amount: `auto` (under 100), `manager` (100 up to but not including 500) and `finance` (500 and above). Claims with no USD amount have no tier. The tier is shown in the table and in the conversion preview, and cannot be set by clients.
- **Documentation:** a README (setup, running, API reference, approval tier rules), an OpenAPI 3.1 spec in `docs/openapi.yaml`, JSDoc on the claims service, and this changelog.
