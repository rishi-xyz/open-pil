# Changelog

## Unreleased

1. Added a landing page at `/` with diagrams of the filing transaction, record lifetimes and entity model, plus sections on why India, why Arkiv, how each Arkiv feature appears in the app, and how to verify reads independently.
2. Moved the petitions list from `/` to `/petitions`. Navigation and the petition page back links now point there.
3. Browser reads now go only through the keyed `/api/arkiv` proxy, without the public RPC fallback. `TIRAMISU_API_KEY` is required for browser reads.
4. Recorded the captured `ANON_COST_LIMITED` response in the friction report, warned about the anonymous query cost budget in the schema, and documented that petition `court` and `duedate` remain patchable by the petitioner.
5. Removed internal planning documents, HTML design mocks, unused Next.js starter assets and an unused motion component. Added a hackathon submission section to the README.

## 0.2.0 (19 October 2026)

Public demo court. This describes repository behavior, not confirmation of deployment.

1. Added `/court`, a public page listing petitions under review by the demo court where anyone can accept, reject or extend a review without signing in. The page and navigation label it a demonstration.
2. Added `POST /api/court/decide` and `POST /api/court/extend`. A `server-only` signer holds the court key and access key at runtime. Each request passes a same origin check, per IP attempt and write limits, a bounded body, Zod validation with the existing 32 KB reason cap, then one serialized re read of chain state (live court owned lease, no decision, deadline not passed, later extension deadline) before signing. Refusals return `409`; provider errors are never returned.
3. Removed the wallet gated court panel from the petition page and replaced it with an "Open court" link while a review is open. Keep alive is unchanged.
4. Extracted `decisionBatch` and `extensionBatch` builders and gave query helpers an optional reader so the server reuses the same preflight and batches as the seed script.
5. Added tests for request validation, state checks, rate limits, origin checks, write serialization and error mapping.

## 0.1.0 (18 October 2026)

OpenPIL revision 3 for the Arkiv Global Tour Stop. This describes repository behavior, not confirmation of deployment or submission.

1. Replaced the former PDF and hash workflow with public markdown petitions, markdown decision reasons and a registered court model. Removed respondent and organisation onboarding screens.
2. Added Petitions, New petition and petition detail views with status filters, markdown preview, timeline, verification checks and review lease displays.
3. Added atomic petition and review creation with ownership transfer, court acceptance or rejection with live lease deletion, and atomic review extensions.
4. Added chain time based status, chronological extension validation, late decisions, registry creator checks and neutral petitioner identities.
5. Added 120 day public records and permissionless Keep alive for petitions and decisions, adding 30 days of blocks to existing expiry.
6. Added shared paginated snapshot reads, read proxy with public RPC fallback, rate limit backoff, wallet balance notices and live event refresh.
7. Added synthetic seed definitions for one court, two petitioners and eight petitions across under review, accepted, rejected and expired states, including an extension.
8. Added a light visual design, Docker deployment on host port 3400, MIT licensing and revision 3 schema, setup and friction documentation.

The earlier PDF implementation is superseded. Deployment, public repository and video URLs remain placeholders. Build window eligibility and any preexisting baseline disclosure require maintainer confirmation.
