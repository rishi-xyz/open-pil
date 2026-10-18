# Developing OpenPIL

## Setup and checks

Use Node.js 22 and pnpm 9.15.0. Read `AGENTS.md`, [schema.md](arkiv/schema.md) and `docs/arkiv-sdk-brief.md` (SDK notes gathered during the build). Next.js is 16.4.2; read relevant installed guides in `node_modules/next/dist/docs/` before changing framework code. Arkiv SDK is pinned to 0.8.1.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev --port 3400
```

Configure the public registry address and Privy app ID as described in [README.md](README.md). Allow `http://localhost:3400` in Privy. The read proxy requires runtime `TIRAMISU_API_KEY`; without it `/api/arkiv` returns 503 and browser reads fail. The demo court needs runtime `ORG_MUNICIPAL_PRIVATE_KEY` and uses `TIRAMISU_API_KEY` for its own reads and sends. No Privy app secret is needed for browser login. Never place access keys or signing keys in public environment variables.

```sh
pnpm exec tsc --noEmit
pnpm lint
pnpm vitest run
```

Run `pnpm build` before deploying. A passing development server does not prove the production build succeeds.

## Structure

`app/(app)` contains the landing page at `/`, the petitions list at `/petitions`, `/new`, `/court` and `/petitions/[key]`. The landing page (`components/screens/landing`) is a static server component; keep its claims in step with the code and [schema.md](arkiv/schema.md). `components/screens` contains screen logic, `components/record` shared record presentation, and `components/markdown/markdown.tsx` the markdown rendering boundary. Use `<Markdown source />` for public bodies and reasons.

`lib/arkiv/model.ts` builds typed attributes and validates markdown limits. `records.ts` validates and serializes untrusted reads. `trust/revision3.ts` derives court trust, deadlines, status and lateness. `writes` contains wallet operations and the pure `decisionBatch` and `extensionBatch` builders. `queries` contains independent query helpers, also used for write preflight; each accepts an optional reader so the server can supply a credentialed client. [schema.md](arkiv/schema.md) documents every stored type and exact read expression.

`lib/arkiv/court` is the public demo court. `signer.ts` is `server-only` and builds the credentialed reader and the court wallet from runtime secrets. `handler.ts` is a pure request handler with injected dependencies: same origin check (`origin.ts`), per IP limits (`rate-limit.ts`), Zod schemas (`schema.ts`), the chain state guard (`guard.ts`) and the per signer queue (`queue.ts`). `route.ts` wires the defaults for `app/api/court/decide` and `app/api/court/extend`. Tests cover validation, state checks, rate limits, origin, serialization and error mapping with a mocked signer; nothing in the tests touches the network.

`hooks/use-openpil-snapshot.ts` reads all pages of the application namespace and block timing. It shares a 20 second fresh snapshot; `snapshot.ts` derives list and detail views locally. Browser reads use only `/api/arkiv`; server code reads public RPC directly. `app/api/arkiv` is a restricted read proxy with a server held access key, not a signer. Filing and Keep alive remain browser wallet operations. Court decisions and extensions are signed on the server by the demo court key; the seed script is the other private key signing path.

Keep concerns in small files and match existing idioms. Use TypeScript strict, Tailwind v4 and installed shadcn components. Pure behavior ships with meaningful Vitest tests; network code is not unit tested. Drop malformed records without losing a whole page. Convert BigInts to strings before JSON or React boundaries. Timestamp writes and predicates use `u64()`; wallet and reference attributes currently use `str`. Creator and owner metadata must be checked independently of claimed attributes.

## Docker

Create `.env.local` with the public configuration and optional runtime `TIRAMISU_API_KEY`, then run:

```sh
docker compose --env-file .env.local up --build
```

Open http://localhost:3400. Compose maps `${OPENPIL_PORT:-3400}` to container port 3000. `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_REGISTRY_ADDRESS` and `NEXT_PUBLIC_TIRAMISU_RPC_URL` are build arguments loaded through Compose environment substitution. Public changes need an image rebuild. `env_file: .env.local` supplies runtime secrets only. Never add private keys or the RPC access key to Docker build arguments. `.env*` files are excluded from the build context. The multi stage Node 22 Alpine image runs the standalone server as a non root user and healthchecks `/`.

Validate the Docker image with a full build before deploying. A successful development server is not evidence that a production image builds.

## Synthetic seed and cleanup

The seed defines one registered court and two petitioner wallets, with eight synthetic markdown petitions. There are two each under review, accepted, rejected and expired, and one extension. Dates are relative to seed time; counts change later.

Supply funded test keys through the local script environment only:

| Environment variable | Role |
| --- | --- |
| `REGISTRY_PRIVATE_KEY` | Registry creates the court attestation |
| `ORG_MUNICIPAL_PRIVATE_KEY` | Court creates decisions and extensions; also the demo court signer at runtime |
| `ORG_NGO_A_PRIVATE_KEY` | Petitioner A |
| `ORG_NGO_B_PRIVATE_KEY` | Petitioner B |

These four wallets must be distinct. The historic variable names are retained by the scripts; they do not imply NGO registration or a municipal respondent in revision 3. The funding wallet performs transfers only. Do not publish keys or use real personal data.

```sh
node --env-file=.env.local --import tsx scripts/seed.ts openpil-demo-r3
```

This spends test GLM and writes `scripts/seed-output.json` with entity keys, transaction hashes and per case progress. Registry lookup and saved completion records support reruns. An incomplete case or an existing title without reconciled output stops the script. After an uncertain write, reconcile its transaction and output before rerunning; do not blindly retry.

For explicitly authorized cleanup:

```sh
node --env-file=.env.local --import tsx scripts/unseed.ts
```

Unseed deletes live OpenPIL entities owned by seed wallets, including old `pil`, `pending`, `response` and `adjournment` types. It is destructive testnet cleanup, not a read check. PDF samples and PDF generation are no longer part of the product.

## Manual verification and handoff

Check desktop and mobile list filters and counts, markdown creation and preview, petition verification and Recheck, demo court decisions and extensions at `/court` without signing in, refusals after the state changed (409), late decisions, Keep alive, signed out behavior, low balance notices and rate limit recovery. Compare explorer creators and owners with UI claims. Rerun the public queries in the schema independently of the proxy. Never report a check passed unless it ran.

Use synthetic data only. Reuse is permitted by the MIT licence.
