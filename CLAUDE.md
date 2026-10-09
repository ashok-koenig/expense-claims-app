# Expense Claims App

Node 20+ / Express backend with in-memory storage, plus a TypeScript frontend: source in `public/ts/`, compiled by `tsc` to `public/js/` (generated and git-ignored; never edit it by hand), served from `public/`.

## Commands
- `npm run dev` – build the frontend, then start with nodemon
- `npm start` – build the frontend, then start with node
- `npm run build` / `npm run typecheck` – compile / type-check `public/ts/`
- `npm test` – placeholder until tests exist

## Conventions
- **Layered code:** feature code stays layered: routes → controllers → services → repositories, with shapes and allowed values in `models/`. Keep each layer to its own job (no storage access in controllers, no HTTP concerns in services).
- **Money:** amounts are numbers with at most two decimal places. Currencies are 3-letter ISO 4217 codes (e.g. `USD`, `EUR`).
- **New fields:** a new claim field is always added to the model, the validation, and the frontend (the `Claim` type in `public/ts/types.ts`, its runtime check, the form and the table) together in one pass. Never leave them partially updated.
- **Frontend types:** `Claim` is defined once in `public/ts/types.ts` and reused everywhere. No `any`, no `@ts-ignore`, and no casts that only silence the compiler; check data from the network at runtime with the type guards instead.
- **Structure:** do not add new top-level directories without asking first.
- **Secrets:** only `.env.example` is committed; never commit `.env` or real secrets.
