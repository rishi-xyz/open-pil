# Arkiv integration friction

Scope: `@arkiv-network/sdk` 0.8.1, viem 2.57.7 and Tiramisu chain `7738577`, observed during the build on 18 October 2026. Evidence comes from installed SDK sources, `docs/arkiv-sdk-brief.md` and observations made while building. The final documentation pass did not repeat live RPC requests or broadcast transactions. Suggested reproductions below are distinct from checks actually repeated.

## 1. Transport and account imports are outside the SDK

Expected: examples make the package boundaries clear when creating an Arkiv client. Actual: the SDK has no root `http` export and no `./accounts` export. Importing them from the SDK fails before connecting. This is an integration discoverability issue, not a missing transport capability.

Versions: SDK 0.8.1 and viem 2.57.7. Evidence: installed SDK `package.json` exports and `src/index.ts`; the brief's client examples.

Steps: run `node --input-type=module` in the installed repository, then try `await import("@arkiv-network/sdk/accounts")` and inspect `"http" in await import("@arkiv-network/sdk")`. The subpath fails resolution and the root has no such export.

Workaround: import `http`, `webSocket` and `custom` from `viem`; import `privateKeyToAccount` and `nonceManager` from `viem/accounts`. Client factories come from the Arkiv SDK. Suggested fix: put this import matrix prominently in quickstarts and migration guidance, including browser and script examples.

## 2. Creation block filter differs between SDK and node

Expected: the typed builder and node agree about `$createdAt` filtering. Actual: the SDK rejects `gt("$createdAt", u64(1))` with `InvalidPredicateError` because the field carries no index, while a raw equivalent was accepted by Tiramisu in the brief's live check.

Versions: SDK 0.8.1 and Tiramisu on 18 October 2026. Evidence: brief section 4.3 and `src/query/expression.ts`. An earlier documentation pass repeated the local builder error. Its RPC retry failed DNS resolution, so node acceptance was not reconfirmed then or in the final pass.

Steps: in the Node REPL setup from [schema.md](schema.md), import `gt` from `@arkiv-network/sdk/query` and `u64` from `@arkiv-network/sdk/attr`. Evaluate `gt("$createdAt", u64(1))`, then compare with `await client.query("$createdAt > u64(1)", { limit: 1 })` when RPC is available.

Workaround: retrieve creation block metadata and evaluate authoritative timing locally. Use explicit `u64` user timestamp attributes for application range queries, while recognizing those values are writer supplied. Suggested fix: align SDK validation, node behavior and documentation, with a compatibility test for this predicate.

## 3. A valid predicate with the wrong attribute type silently matches nothing

Expected: an apparently equal value either matches or gives a useful type diagnostic. Actual: a stored `u64` value does not match a bare bigint predicate, which becomes `u256`; the query can return an empty result without a type mismatch error. A bare millisecond number is a different case: it exceeds `i32` and can fail locally.

Versions: SDK 0.8.1 and Tiramisu on 18 October 2026. Evidence: brief section 3.6 and SDK `src/attr/values.ts`. The final pass checked the current attribute builders; it did not create another test entity.

Steps: with an existing record whose `duedate` is a known `u64`, query `eq("duedate", BigInt(exactStoredValue))`, then query `eq("duedate", u64(exactStoredValue))` under the same namespace and type filters. The first predicate uses a different cell type and does not match; the second can match the live record. Do not use a newly sampled timestamp.

Workaround: use identical constructors on write and query. The current app also stores entity references and wallet attributes as `str`; predicates must preserve that choice. Suggested fix: add an optional diagnostic mode or prominently document typed equality and the bare value defaults next to predicate examples.

## 4. Lifetime Extension sets a target expiry rather than adding a duration

Expected during initial integration: requesting another 30 days would add to the current lease. Actual: a relative duration is measured from the transaction's current block. If that target is earlier than an existing expiry, the engine rejects it with `ExpiryNotExtended`. This is documented semantics that were easy to misread, not a claim that the engine adds incorrectly.

Versions: SDK 0.8.1 and Tiramisu on 18 October 2026. Evidence: brief section 3.4, `src/actions/wallet/extendEntity.ts` and current write helpers.

Steps for a funded test wallet: start with an owned entity that still has more than 30 days remaining, then call `extendEntity({ entityKey, expires: ExpirationTime.fromDays(30) })`. The requested target does not exceed the current expiry. Compare with `ExpirationTime.atBlock(entity.expiresAt + 30n * 43200n)` after reading the current entity. This reproduction spends GLM and was not rerun in the final pass.

Workaround: Keep alive uses an absolute current expiry plus 30 days of blocks. Review extensions choose the greater of current expiry plus one block and the calculated deadline block. Suggested fix: show the additive recipe beside the duration example and explain `ExpiryNotExtended` with an existing long lease.

## 5. Anonymous rate limits affect both reads and WebSocket connection setup

Expected: a small demo's navigation and event connection can share public RPC without immediately failing. Actual build observations: separate screen queries returned HTTP 429, and an anonymous WebSocket handshake also received 429. The latter was observed during the build; no new handshake trace was captured for this report. This is not a claim of a fixed request threshold.

Versions: SDK 0.8.1, viem 2.57.7 and Tiramisu on 18 October 2026. The prior report records navigation failures. Brief section 6 records anonymous headers `limit=600`, `reset=60` and an `arkiv_query` cost of 100. How those units map to an allowance, and whether the budget is per IP or shared with WebSocket setup, remain unverified.

Captured on 18 October 2026 at about 20:50 UTC, while rerunning the [schema.md](schema.md) whole namespace read (`select("*").where(eq("app", "openpil")).limit(200)`) without an access key:

```
HTTP 429
ratelimit: limit=10000, remaining=0, reset=472
retry-after: 472
{"error":"ANON_COST_LIMITED","message":"unauthenticated query budget exhausted; get an API key at https://hub.arkiv.network for a monthly quota"}
```

At the same time `eth_blockNumber` still succeeded with `ratelimit: limit=600`. So anonymous reads have two budgets: a 600 request window and a separate 10000 unit query cost budget. The SDK surfaces the cost budget only as a generic HTTP error. The budget was exhausted after a small number of whole namespace reads from one IP (two read sessions ran concurrently, so the exact count is not attributable). After the reset window, a raw `arkiv_query` for `app = "openpil"` with limit 100 and no payload returned HTTP 200 with `arkiv-cost: 100`.

Steps: open Developer Tools Network with no access key. Execute the independent queries in [schema.md](schema.md) within a rate window while recording statuses and any `RateLimit`, `Arkiv-Cost` and `Retry-After` headers. Attempt a `webSocket()` client connection to the same anonymous Tiramisu host and inspect the upgrade response. Stop at 429 and allow recovery; thresholds vary and a successful retry does not disprove the earlier failure. Do not generate load to force a quota failure.

Mitigation: one shared paginated snapshot replaces separate reads for each screen. Its freshness is 20 seconds, with 10 minute memory retention and browser persistence. Browser reads go only through the read proxy, which holds the RPC access key on the server. An earlier public RPC fallback was removed because anonymous browser reads shared the per IP quota with the WebSocket handshake. Query backoff starts at 60 seconds for rate limits and doubles up to 240 seconds; the current retry helper does not dynamically parse `Retry-After`. The WebSocket client disables automatic reconnect and transport retry. Snapshot cost still grows with the dataset.

Suggested fix: document both anonymous budgets (request window and query cost), the cost of a `select("*")` scan with payloads, and WebSocket handshake limits together; map `ANON_COST_LIMITED` to a typed SDK error carrying `retry-after`; expose actionable retry metadata through SDK errors and provide guidance for sharing read caches. Never put an access key in the browser bundle.

## 6. Events omit project attributes and creator identity

Expected for this application: classify a project event and its signer before spending another query. Actual: `watchEntityEvents` delivers keys, ownership and transaction context, plus creation expiry and flags, without arbitrary attributes or `$creator`. Subscription options have no project or creator predicate. Owner identity cannot substitute for creator provenance.

Versions: SDK 0.8.1 and Tiramisu on 18 October 2026. Evidence: `src/actions/public/watchEntityEvents.ts`, `src/types/events.ts` and brief section 5, which records unrelated events during a live subscription. An earlier documentation pass repeated source inspection, not the live subscription.

Steps: create a client using viem `webSocket()`, subscribe with `watchEntityEvents({ onEvent: console.log })` without `fromBlock`, then compare an event with `getEntity(event.entityKey)`. Stop using the returned unsubscribe function. The event does not include the record's namespace attributes or immutable creator.

Mitigation: filter against known wallets and coalesce snapshot refreshes. This can miss unknown filers, so events are refresh hints and never trust evidence. Suggested fix: add optional indexed project or creator subscription filters, or document an efficient batch resolution path for event keys while preserving the distinction between creator and owner.
