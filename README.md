# OpenPIL

Public markdown petitions with independently queryable court decisions and expiring review leases on Arkiv.

Live demo: https://openpil.rishixyz.com/

Public repository: https://github.com/rishi-xyz/open-pil

Demo video: [Video](https://youtu.be/KH0s4pFzajw).

## Why India

Public Interest Litigation gives civic concerns a route to court. A missing filing record or an unverifiable claim of a decision makes public scrutiny harder. OpenPIL demonstrates a public record of who filed, which registered court decided, and whether the review deadline passed. The demo uses synthetic civic petitions and the fictional High Court of Vindhya Pradesh (`VPHC`). It is not an official court filing service, proof of legal validity or evidence of government adoption.

## Try it

1. Start at `/`, a landing page that explains the petition lifecycle, why it runs on Arkiv and how to verify it. Open Petitions at `/petitions`. Filter by court, title or status and inspect the live feed.
2. Open a petition to read its markdown body, decision reason, timeline and Verification status panel. Explorer links expose the entity, creator and current owner.
3. Sign in at `/new`, fund your test wallet, and submit a synthetic markdown petition with a future deadline. One transaction creates the petition and transfers its review lease to the registered court.
4. Open the demo court at `/court`. Without signing in, accept, reject or extend any petition under review. The server signs with the demo court key and re reads chain state before every write. Any funded wallet can keep a petition or decision alive for another 30 days of blocks.

The seed defines eight petitions: two under review, two accepted, two rejected and two expired. One review has an extension. Live counts change as deadlines pass or entities expire.

## Why Arkiv

Removing Arkiv removes the shared source of creator provenance, transferable review ownership, atomic decisions and queryable expiration. An operator controlled database would require readers to trust the operator's account of those events. IPFS alone does not supply these typed queries and ownership operations. Anyone can reproduce the reads through the public Tiramisu RPC using [the exact query contract](arkiv/schema.md), independently of this deployment.

Browser reads go through the read proxy at `/api/arkiv`, which holds the access key on the server. Anonymous browser reads would share the per IP quota with the live feed WebSocket, so the browser never calls public RPC directly. Petition filing and Keep alive are signed by the user's wallet in the browser. Court decisions and extensions are signed on the server by the demo court key through `/api/court/decide` and `/api/court/extend`, which check same origin, rate limits, input bounds and live chain state before every write. Public RPC rate limits and availability still affect independent reads.

| Arkiv feature used | Visible behavior |
| --- | --- |
| Typed attributes and markdown payloads | Court and title filtering alongside a rendered petition body and decision reason |
| Immutable `$creator` metadata and registry scope | Court seal and Verification status checks against registry attestations |
| Ownership transfer | Review rail identifies the court as lease owner and the petitioner as creator |
| Atomic batches with predicted keys | New petition opens its review in one transaction; a decision closes a live review in the same transaction |
| Per entity expiration | A review ends at its deadline while the petition initially lasts 120 days; missed deadlines show Expired |
| Lifetime Extension | Court extension updates the review deadline; Keep alive adds 30 days of blocks to a petition or decision |
| WebSocket entity events | Live feed refreshes the shared snapshot for relevant known wallets |
| Cursor pagination | Shared snapshot walks every page before deriving list counts and detail views |

Attributes and payloads are public. Markdown bodies and reasons, wallet addresses, titles, court codes and dates are on Arkiv. Keep real identities, sensitive documents, credentials, private keys and payments off Arkiv. The app does not fund wallets. Use synthetic content only. Expiration removes live query state but cannot erase copies or transaction calldata. Records are mutable by their owners; creator metadata alone does not prove the original contents remained unchanged.

## Run locally

Use Node.js 22 and pnpm 9.15.0. This repository uses Next.js 16.4.2 and Arkiv SDK 0.8.1.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Set these public values in `.env.local`:

```dotenv
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_REGISTRY_ADDRESS=0xcBC4caBF5Fbb766ee1796E2Bb5EaEa98a445E14f
NEXT_PUBLIC_TIRAMISU_RPC_URL=https://rpc.tiramisu.db-chain.testnet.arkiv.network
```

Allow `http://localhost:3400` and your deployment origin in Privy. Sign in with Google, Telegram, X or Discord (enable these login methods in the Privy dashboard). Every user gets a Privy embedded wallet; browser wallet extensions are not supported. Without a Privy app ID, public reading remains available. `PRIVY_APP_SECRET` is not required. Set `TIRAMISU_API_KEY` as a server runtime secret. The read proxy needs it for all browser reads (without it `/api/arkiv` returns 503), and the demo court uses it too. Set `ORG_MUNICIPAL_PRIVATE_KEY` (a funded testnet key registered as the court) as a server runtime secret to enable the demo court at `/court`; without it the page reports that the court is not configured. Never put secrets in `NEXT_PUBLIC_*` variables.

```sh
pnpm dev --port 3400
```

Open http://localhost:3400. Writes need test GLM on Tiramisu, chain ID `7738577`. Use the [faucet](https://hub.arkiv.network/faucet); the account menu and low balance notices link to it.

For Docker, with the same `.env.local`:

```sh
docker compose --env-file .env.local up --build
```

Compose exposes port 3400 by default. Public environment values are build arguments and require a rebuild when changed. Server secrets are supplied at runtime, never baked into the image. See [DEVELOPER.md](DEVELOPER.md) for checks and seed operations.

## Entity creating wallets

Network: Tiramisu `7738577`. [Explorer](https://tiramisu.explorer.arkiv.network).

| Role | Wallet | Operations |
| --- | --- | --- |
| Registry | `0xcBC4caBF5Fbb766ee1796E2Bb5EaEa98a445E14f` | Creates court `org` attestations |
| Court | `0xDf7b54EbE12AB921C5000cEeA338bE66636668ed` | Creates `decision` and `extension` (seed script and the public demo court); owns transferred reviews |
| Petitioner A | `0x21Dbd7C8e7f4c4c4Bae39Faeaa03e6d46f5Bd276` | Creates `petition` and `review` |
| Petitioner B | `0x5b6F468D587dEe45E0c8ca87B19B33414894B049` | Creates `petition` and `review` |
| Faucet funding | `0x5515C7015162a75d111c9d4C61d7E17aB9565ac8` | Transfers only; creates no project entities |

Other signed in users create petitions and reviews from their own wallets. `scripts/seed-output.json` records seed entity keys and transaction hashes. The funding wallet is not an entity creator.

## Trust and limitations

The configured registry is the court identity authority. Petitioners need no registry attestation. The demo court is a public demonstration: every visitor's decision or extension is signed by the same court key, so it shows how a registered court's record behaves, not who decided. The client checks on-chain creators, court codes and review ownership, since anyone can copy `app = "openpil"`. Verification establishes application provenance, not the truth or legal effect of a petition. Petition `court` and `duedate` attributes remain patchable by the petitioner through the SDK, which could change derived status; [schema.md](arkiv/schema.md) describes this limitation and its fix. There is no organisation onboarding UI. Domain proof and a production court identity policy remain future work.

Unknown wallet events may be missed by the feed. Snapshot reads remain the source for status. Expired or deleted decisions and registry attestations disappear from normal queries and can affect derived status. See [friction.md](arkiv/friction.md) for observed SDK and RPC issues and [schema.md](arkiv/schema.md) for the trust rules.

## Hackathon submission

Built for the Arkiv Global Tour Stop (9 to 18 October 2026). Tracks: Censorship Resistance and Security.

1. Data contract: [arkiv/schema.md](arkiv/schema.md) lists entity types, attributes, expiration per type and every query the app runs.
2. Friction report: [arkiv/friction.md](arkiv/friction.md) covers each Arkiv surface used, with expected and actual behavior, versions and reproduction steps.
3. Licence: [MIT](LICENSE).
4. Changes: [CHANGELOG.md](CHANGELOG.md). Developer notes: [DEVELOPER.md](DEVELOPER.md).

All petitions, courts and identities in the demo are synthetic.
