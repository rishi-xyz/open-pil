# OpenPIL revision 3 data contract

Source checked against `lib/arkiv/model.ts`, `lib/arkiv/writes`, `lib/arkiv/queries`, `lib/arkiv/trust/revision3.ts` and `hooks/use-openpil-snapshot.ts`. SDK: `@arkiv-network/sdk` 0.8.1. Network: Tiramisu, chain ID `7738577`.

HTTP RPC: `https://rpc.tiramisu.db-chain.testnet.arkiv.network`

WebSocket RPC: `wss://rpc.tiramisu.db-chain.testnet.arkiv.network`

## Attributes and payloads

Every entity has `app: str = "openpil"` and `type: str` equal to its type below. Types describe actual stored cells, not the semantic meaning of their values. Bare strings become `str`, bare numbers become `i32`, and timestamps explicitly use `u64`. All dates in attributes are Unix milliseconds. In particular, `petition` references and wallet attributes currently use `str`, not native `key` or `addr` cells. `$creator` and `$owner` are native address metadata.

| Entity type | Additional attributes with exact stored types | Payload and content type |
| --- | --- | --- |
| `org` | `wallet: str` lowercase address; `role: str = "court"`; `court: str` court code (builder permits omission; court trust requires it) | `application/json`: `{ "name": string, "about": string, "website"?: URL }` |
| `petition` | `title: str` nonempty, trimmed, at most 120 UTF8 bytes; `court: str` code; `filedat: u64`; `duedate: u64` | `text/markdown`: nonempty UTF8 body, at most 32768 bytes |
| `review` | `petition: str` lowercase entity key; `court: str` lowercase court wallet; `duedate: u64`; `extensions: i32` nonnegative count, initially 0 | `application/json`: `{}` |
| `extension` | `petition: str` lowercase entity key; `newdue: u64` | `text/markdown`: nonempty UTF8 reason, at most 32768 bytes |
| `decision` | `petition: str` lowercase entity key; `outcome: str` either `accepted` or `rejected`; `decidedat: u64` | `text/markdown`: nonempty UTF8 reason, at most 32768 bytes |

| Entity type | Initial expiration | Creation flags | Initial creator and owner |
| --- | --- | --- | --- |
| `org` | 120 days | `readonly: false`, `permissionlessExtension: true` | Registry creates and owns |
| `petition` | 120 days | `readonly: false`, `permissionlessExtension: true` | Petitioner creates and owns |
| `review` | `ExpirationTime.atDate(new Date(duedate))` | Both false (flags omitted) | Petitioner creates; filing batch transfers ownership to court |
| `extension` | 120 days | `readonly: false`, `permissionlessExtension: true` | Court creates and owns |
| `decision` | 120 days | `readonly: false`, `permissionlessExtension: true` | Court creates and owns |

The current Keep alive UI and write helper permit only petitions and decisions, although the other permissionless records can also be extended through the SDK. Keep alive sets `ExpirationTime.atBlock(currentExpiresAt + 30n * 43200n)`. The network's nominal block duration is two seconds. This adds to the existing expiry rather than requesting 30 days from now.

All records remain mutable by their owners. Permissionless extension grants no patch, transfer or delete authority. `$creator` is immutable provenance; `$owner` is current authority. Expired and deleted entities are absent from ordinary reads; expiry is not erasure of calldata or third party copies.

## Exact reads

Run `node --input-type=module` from the installed repository and paste this setup. It contacts the public RPC directly without a login, access key or OpenPIL server. Anonymous rate limits still apply: a full `select("*")` scan with payloads draws on a separate anonymous query cost budget and can return HTTP 429 `ANON_COST_LIMITED` (see [friction.md](friction.md) item 5). Run one query at a time; if refused, wait for the `retry-after` seconds or use an access key from the Hub.

```js
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { eq, or } from "@arkiv-network/sdk/query";
import { http } from "viem";
const client = createPublicClient({ chain: tiramisu, transport: http() });
const registry = "0xcBC4caBF5Fbb766ee1796E2Bb5EaEa98a445E14f";
const court = "0xDf7b54EbE12AB921C5000cEeA338bE66636668ed";
const petitioner = "0x21Dbd7C8e7f4c4c4Bae39Faeaa03e6d46f5Bd276";
const scoped = (...filters) => client.select("*")
  .where(eq("app", "openpil"), ...filters).limit(50);
```

The normal screen path is the shared snapshot, exactly:

```js
let page = await client.select("*")
  .where(eq("app", "openpil")).limit(200).fetch();
const entities = [...page.entities];
while (page.hasNextPage()) {
  page = await page.next();
  entities.push(...page.entities);
}
const timing = await client.getBlockTiming();
console.dir({ entities, timing }, { depth: null });
```

The browser transport uses only `/api/arkiv`, a keyed server proxy; server code uses public HTTP RPC. The snapshot cache is fresh for 20 seconds and retained in memory for 10 minutes, with browser storage persistence. Screen filters, search, court lookup, counts, status buckets, petition joins and timeline are derived locally. This is a whole application scan, not one RPC query per visible filter. The initial snapshot query does not explicitly call `.atBlock()`; subsequent pages use SDK `page.next()`.

The independent query modules and write preflight reads use these exact builder expressions. Run calls separately to avoid an anonymous request burst:

```js
// queries/org-registry.ts: orgRegistry(registry)
await scoped(eq("type", "org")).createdBy(registry).fetch();

// queries/petitions.ts: petitions(), or petitions(cursor, creator)
await scoped(eq("type", "petition")).fetch();
await scoped(eq("type", "petition")).createdBy(petitioner).fetch();

// courts(registry)
await scoped(eq("type", "org"), eq("role", "court"))
  .createdBy(registry).fetch();

// reviewsOwnedBy(owner)
await scoped(eq("type", "review")).ownedBy(court).fetch();

// petitionActivity()
await scoped(or(eq("type", "review"), eq("type", "extension"),
  eq("type", "decision"))).fetch();
```

For a particular petition, copy its full entity key from the app or seed output and set `petitionKey`:

```js
// Replace with an actual 0x prefixed 64 hex character entity key.
const petitionKey = "<PETITION_ENTITY_KEY>";
// petitionRelated(key): helper normalizes the key to lowercase.
await scoped(eq("petition", petitionKey.toLowerCase())).fetch();
// petitionBundle(key): runs getEntity and petitionRelated concurrently.
await client.getEntity(petitionKey);
```

Every `queryPage` call uses selection `"*"`, limit 50, optional `.createdBy()` or `.ownedBy()`, and optional `.cursor(cursor)` before `.fetch()`. To resume a specific query, preserve its filters, identity scope and selection:

```js
let first = await scoped(eq("type", "petition")).fetch();
if (first.hasNextPage()) {
  const next = await scoped(eq("type", "petition"))
    .cursor(first.cursor).fetch();
  console.dir(next.entities, { depth: null });
}
```

`reviewContext` reads the petition bundle, all pages of registered courts and `getBlockTiming()`; the demo court runs it on the server with an access key before every write. Keep alive uses `getEntity(entityKey)`. Filing uses `predictEntityKeys({ owner: petitioner, count: 2 })`. Wallet balance reads use `getBalance({ address })`. These supplement the query contract rather than supply additional status filters. The app currently runs no timestamp range predicate. A custom range must use `u64()` on both sides; plain bigint means `u256` and will not match a `u64` attribute.

## Writes and trust

Filing predicts two keys, then atomically creates petition and review and transfers the review to the court. Returned keys are compared with predictions. A court must be registered for the petition's court code before filing.

A registry attestation counts only if its on-chain creator is the configured registry, its role is `court`, and its court code and wallet are valid. A review must reference the petition, have the petitioner as creator, and be owned by a court wallet registered for the petition's court code; its `court` attribute must equal that owner. Decisions and extensions must reference the petition and have a registered court for that code as creator. Petitioners are shown neutrally and need no registration.

Extension creates a reason record, patches review `duedate` and `extensions`, and extends the review in one batch. The new block expiry is the greater of the calculated deadline block and current expiry plus one block. It requires a live court owned review and a later deadline before the current deadline passes.

Decision creates a reason record and deletes the court owned review in one batch when present. If the review has expired or is absent, it creates the decision alone. Status uses creation block time, not the declared `decidedat` hint. Accepted or rejected decisions can be late.

In the deployed app, decisions and extensions come from the public demo court (`/court`, `POST /api/court/decide`, `POST /api/court/extend`). The server signs with the court wallet, so `$creator` of every demo decision and extension is the registered court. Before each write the server re reads the petition bundle, the registered courts and block timing with a credentialed reader and refuses unless a live review lease owned by the court exists, no decision exists, chain time is before the effective deadline, and an extension deadline is later than the current one. The demo court only writes while a petition is Under review; late decisions remain possible only through the SDK or the seed script. Stored attributes, payloads, expirations and flags are unchanged from the table above.

Known limitation: petitions are created with `readonly: false`, and derivation reads the petition's `court` and `duedate` attributes. The petitioner owns the petition, so through the SDK they could patch `court` or `duedate` after filing, including after a decision. That would change which court's decisions count and when Expired applies. The UI never patches petitions, and every patch is a public transaction visible on the explorer, but derived status is only as stable as those two attributes. A production version should create petitions with `readonly: true` (after confirming permissionless Keep alive still applies), or copy the court and initial deadline into the court owned review and derive from it.

Derivation ignores related records outside the live block window. Extensions are considered chronologically by creation block and key, must precede the selected decision, must be created on or before the deadline then in force, and must increase it. The first valid decision in that ordering determines outcome. Otherwise a passed effective deadline means Expired, even when the review lease still exists. A live valid review before the deadline means Under review. A missing valid review before the deadline is `review-incomplete`, not a trusted open review.

`getBlockTiming()` supplies the block to wall clock mapping. `$createdAt` and `$expiresAt` are block numbers, serialized as decimal strings at JSON and React boundaries. Malformed records are dropped by page serialization rather than rejecting all valid records. Namespace attributes alone never establish trust.

## Live refresh

`watchEntityEvents` uses a WebSocket client without `fromBlock`. Events lack project attributes and creator identity. The feed filters known wallets and coalesces snapshot refreshes; it can miss unknown filers. An event is a refresh hint, not proof of authorship. Requery current entities to establish state. Ordinary expiry does not supply a natural expiration event.
