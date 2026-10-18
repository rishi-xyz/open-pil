# Arkiv Tiramisu and `@arkiv-network/sdk` 0.8.1: factual brief for the OpenPIL spec

Researched 18 October 2026. Package inspected: `@arkiv-network/sdk@0.8.1` (npm `latest` tag; `dev` is `0.8.1-dev.1`), peer `viem@^2` (inspected `viem@2.57.7`). The npm tarball ships the TypeScript sources under `src/`, so every `src/...` citation below is a path inside `node_modules/@arkiv-network/sdk/`. Scratch copy: `/Volumes/intellica/arkiv/open-pil/.claude/scratch-sdk/pkg/package/`.

Citation tags:
- `[pkg: src/...:line]` is the SDK source.
- `[viem: ...]` is the viem source.
- `[doc: URL]` is docs.arkiv.network or the hackathon repo.
- `[live]` is a request I made against the Tiramisu RPC on 18 October 2026. Live results can change.
- **UNVERIFIED** marks anything not confirmed by source, docs or a live call.
- **General web fact** marks claims about browsers that do not come from Arkiv sources.

## 0. Read this first: names changed in 0.8

Several names in the task brief and in older tutorials do not exist in 0.8.1. A grep of `src/` and `dist/index.d.ts` for `updateEntity`, `mutateEntities`, `expiresIn`, `withPayload` and `orderBy` finds only one hit, a test helper called `withPayload` in `src/types/entity.test.ts`. The real 0.8.1 names:

| Brief or older name | 0.8.1 reality | Source |
|---|---|---|
| `updateEntity` | `patchEntity({ entityKey, set, unset, payload?, contentType? })` | `[pkg: src/actions/wallet/patchEntity.ts:34]` |
| `mutateEntities` | `executeBatch({ creates, patches, deletes, extensions, ownershipChanges })` | `[pkg: src/actions/wallet/executeBatch.ts:20]` |
| `expiresIn` (seconds) | `expires: Expiry`, built only with `ExpirationTime.*` | `[pkg: src/actions/wallet/createEntity.ts:57]`, `[pkg: src/utils/expirationTime.ts:46]` |
| `withPayload / withAttributes / withMetadata` | `client.select({ payload: true, attributes: true, owner: true, ... })` | `[pkg: src/query/selection.ts:10]` |
| `orderBy` | Does not exist. Results come back newest first, and the node supports no other order. | `[doc: https://docs.arkiv.network/typescript-sdk/querying-data/]`, AGENTS.md of the hackathon repo |

## 1. Network: Tiramisu

| Item | Value | Source |
|---|---|---|
| Chain ID | `7738577` (`0x7614d1`) | `[pkg: src/chains/tiramisu.ts:7]`, `[live]` `eth_chainId` returned `0x7614d1` |
| HTTP RPC | `https://rpc.tiramisu.db-chain.testnet.arkiv.network` | `[pkg: src/chains/tiramisu.ts:17]` |
| WebSocket RPC | `wss://rpc.tiramisu.db-chain.testnet.arkiv.network` | `[pkg: src/chains/tiramisu.ts:18]` |
| Native token | GLM, 18 decimals | `[pkg: src/chains/tiramisu.ts:10]` |
| Explorer | `https://tiramisu.explorer.arkiv.network` | `[doc: https://docs.arkiv.network/networks/tiramisu/]` |
| Faucet | `https://hub.arkiv.network/faucet` | `[doc: https://docs.arkiv.network/networks/tiramisu/]` |
| Block time | 2 s nominal (`BLOCK_TIME = 2`). `arkiv_getBlockTiming` returned `duration: 2`. | `[pkg: src/consts.ts:3]`, `[live]` |
| Entity operation contract | `0x4400000000000000000000000000000000000044` (`ARKIV_ADDRESS`) | `[pkg: src/consts.ts:2]` |
| Chain head on 18 Oct 2026 | about block 740,900. About 30,318 live entities chain wide. | `[live]` |

Faucet: the hub page says "One claim per wallet, per cooldown window". The amount and the cooldown length were not visible. **UNVERIFIED**: whether a wallet connection is required (the page shows a "Connecting wallet" state).

Access keys: they are optional on Tiramisu. Without a key you get "the default rate limit". You can send a key in the URL path, in an `X-API-KEY` header or as `Authorization: Bearer`. The docs say keys are **not safe in the browser** because anyone can read them from network requests. `[doc: https://docs.arkiv.network/start-here/access-keys/]`

The chain object comes from the `./chains` subpath: `import { tiramisu } from "@arkiv-network/sdk/chains"`. `chainFromName("tiramisu")` is also exported from the root. `[pkg: package.json exports "./chains"]`, `[pkg: src/utils/chains.ts:13]`

## 2. Clients

Both factories wrap viem's `createClient`. They take viem's `PublicClientConfig` and `WalletClientConfig`, so any viem transport works (`http`, `webSocket`, `custom`, `fallback`).

```ts
// [pkg: src/clients/createPublicClient.ts:45]
export function createPublicClient<transport, chain, accountOrAddress, rpcSchema>(
  parameters: PublicClientConfig<transport, chain, accountOrAddress, rpcSchema>,
): PublicArkivClient<...>
// [pkg: src/clients/createWalletClient.ts:48]
export function createWalletClient<transport, chain, accountOrAddress, rpcSchema>(
  parameters: WalletClientConfig<transport, chain, accountOrAddress, rpcSchema>,
): WalletArkivClient<...>
```

Public client actions: `getEntity`, `select`, `query`, `getEntityCount`, `getEntityNonce`, `predictEntityKeys`, `getBlockTiming` and `watchEntityEvents`. It also has these viem actions: `getBalance`, `getBlock`, `getBlockNumber`, `getChainId`, `getLogs`, `getTransaction`, `getTransactionCount`, `getTransactionReceipt`, `waitForTransactionReceipt` and `watchEvent`. `[pkg: src/clients/decorators/arkivPublic.ts:22-301]`

Wallet client actions: `createEntity`, `patchEntity`, `deleteEntity`, `extendEntity`, `changeOwnership` and `executeBatch`. It also has these viem actions: `waitForTransactionReceipt`, `call`, `simulateContract`, `readContract`, `getBlockNumber`, `addChain`, `sendCalls`, `waitForCallsStatus`, `sendTransaction`, `sendRawTransaction`, `signMessage`, `signTransaction` and `writeContract`. The wallet client type does **not** list `select`, `query` or `watchEntityEvents`, so use a separate public client for reads. `[pkg: src/clients/decorators/arkivWallet.ts:31-258]`

### 2.1 Read only, browser safe (no key, no wallet)

```ts
import { createPublicClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { http, webSocket } from "viem"

export const publicClient = createPublicClient({ chain: tiramisu, transport: http() })
export const wsClient = createPublicClient({ chain: tiramisu, transport: webSocket() }) // for watchEntityEvents
```
`[pkg: src/clients/createPublicClient.ts:35-44]`. The docs call the public client "safe in frontend code". `[doc: https://docs.arkiv.network/typescript-sdk/best-practices/]`

### 2.2 Browser wallet (MetaMask or any injected EIP-1193 provider)

Every write goes through viem `writeContract` to `ARKIV_ADDRESS`, with `account: client.account` and `chain: client.chain`. If either is missing, it throws `"Account required"` or `"Chain required"`. `[pkg: src/utils/arkivTransactions.ts:105-106, 174-182]`. With a `custom(window.ethereum)` transport and a JSON-RPC account (an address), viem sends `eth_sendTransaction` to the wallet. **UNVERIFIED**: I did not trace that viem path in source for this brief, but it is how viem JSON-RPC accounts work.

```ts
"use client"
import { createWalletClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { custom } from "viem"

// switch to Tiramisu, or add it on error 4902 (pattern from the MetaMask sketch app)
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: `0x${tiramisu.id.toString(16)}`,
    chainName: tiramisu.name,
    nativeCurrency: tiramisu.nativeCurrency,
    rpcUrls: tiramisu.rpcUrls.default.http,
    blockExplorerUrls: ["https://tiramisu.explorer.arkiv.network"],
  }],
})
const [address] = await window.ethereum.request({ method: "eth_requestAccounts" })
const walletClient = createWalletClient({ chain: tiramisu, transport: custom(window.ethereum), account: address })
```
`[doc: https://docs.arkiv.network/learn/metamask-sketch-app/1-setup/]` and `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]` ("In the browser, the extension signs... pass `custom(window.ethereum)`"). With wagmi, pass wagmi's transport through `custom(...)` so the user is not asked to connect twice. `[doc: https://docs.arkiv.network/typescript-sdk/react-integration/]`

The wallet asks the user to confirm every transaction, so a batch means fewer prompts. `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`

### 2.3 Private key (seed scripts and server only)

```ts
import { privateKeyToAccount, nonceManager } from "viem/accounts"
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`, { nonceManager })
const wallet = createWalletClient({ chain: tiramisu, transport: http(), account })
```
`[pkg: src/clients/createWalletClient.ts:36-47]`, `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]` (nonceManager). Keep keys in env vars and never commit them. Never put a key in a `NEXT_PUBLIC_*` variable, because Next.js inlines those into the client bundle (**general web fact** about Next.js).

## 3. Writes

All writes return after `waitForTransactionReceipt`. If the receipt shows a revert, the SDK re-simulates the call to decode the reason and throws `EntityMutationError` (it has `.txHash`). `[pkg: src/utils/arkivTransactions.ts:184-245]`. The SDK never retries. `[doc: https://docs.arkiv.network/typescript-sdk/best-practices/]`

Engine revert names include `NotOwner`, `EntityNotFound`, `EntityExpired`, `ReadOnlyEntity`, `ExpiryNotExtended`, `ExpiryDeadOnArrival`, `TransferToZeroAddress`, `TransferToSelf`, `TooManyAttributes` and `Ident32InvalidByte`. `[pkg: src/utils/arkivTransactions.ts:51-80]`

Optional second argument `txParams`: `{ gas?, nonce?, gasPrice? }` or `{ gas?, nonce?, maxFeePerGas?, maxPriorityFeePerGas? }`. `[pkg: src/types/txParams.ts:9-23]`

### 3.1 createEntity

```ts
// [pkg: src/actions/wallet/createEntity.ts:50-108]
type CreateEntityParameters = {
  expires: Expiry                         // required, built with ExpirationTime
  payload: Uint8Array                     // required (pass new Uint8Array() for none)
  contentType: MimeType | (string & {})   // required, lowercase MIME
  attributes?: AttributeInputs
  flags?: CreationFlags                   // { readonly?, permissionlessExtension? }
  salt?: SaltInput                        // bigint | NO_SALT; default random 128 bit
}
type CreateEntityReturnType = { entityKey: Hex; txHash: Hash; expiresAt: bigint }
createEntity(data: CreateEntityParameters, txParams?: TxParams): Promise<CreateEntityReturnType>
```
```ts
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk"
import { u64, str, bytes32 } from "@arkiv-network/sdk/attr"
const { entityKey, txHash, expiresAt } = await walletClient.createEntity({
  payload: jsonToPayload({ title: "synthetic case" }),
  contentType: "application/json",
  attributes: { project: "openpil-xyz", type: "pil", court: "delhi-hc", filedAt: u64(1792300000n), docHash: bytes32(hashHex) },
  expires: ExpirationTime.fromDays(365),
  flags: { permissionlessExtension: true },
})
```
- `contentType` must match `/^[a-z][a-z0-9!#$&\-^_]*\/[a-z0-9][a-z0-9!#$&\-^_.+]*$/`. Uppercase is rejected (`InvalidContentTypeError`). `[pkg: src/utils/arkivTransactions.ts:43-49]`
- `expiresAt` comes back as a block number. For a duration it is a **lower bound**, because the engine resolves the duration against the block where the transaction lands. `[pkg: src/actions/wallet/createEntity.ts:99-107]`
- Payload helpers: `jsonToPayload(obj)` and `stringToPayload(str)`. Read back with `entity.toJson()` and `entity.toText()`. `[pkg: src/utils/payload.ts:15,32]`, `[pkg: src/types/entity.ts:68-103]`

### 3.2 patchEntity (the replacement for "updateEntity")

```ts
// [pkg: src/actions/wallet/patchEntity.ts:34-74]
type PatchEntityParameters = {
  entityKey: Hex
  set?: AttributeInputs            // overwrite or add (the type may change)
  unset?: readonly string[]        // remove; a missing name is not an error
  payload?: Uint8Array             // omit to keep
  contentType?: MimeType | (string & {})
}
patchEntity(data, txParams?): Promise<{ entityKey: Hex; txHash: Hash }>
```
A patch never changes the key, owner, flags or expiry. An empty patch throws `EmptyPatchError`. A name in both `set` and `unset` throws `ConflictingMutationError`. `[pkg: src/actions/wallet/patchEntity.ts:18-19]`, `[pkg: src/utils/arkivTransactions.ts:135-142]`. Only the owner can patch, and a `readonly` entity rejects every patch. `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`

### 3.3 deleteEntity

```ts
// [pkg: src/actions/wallet/deleteEntity.ts:13-41]
deleteEntity({ entityKey: Hex }, txParams?): Promise<{ entityKey: Hex; txHash: Hash }>
```
Only the owner can delete, and the delete takes effect immediately. `readonly` does not block it. Letting an entity expire costs nothing. `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`

### 3.4 extendEntity

```ts
// [pkg: src/actions/wallet/extendEntity.ts:27-74]
extendEntity({ entityKey: Hex, expires: Expiry }, txParams?): Promise<{ entityKey: Hex; txHash: Hash; expiresAt: bigint }>
```
It **sets** a new expiry and does not add to the old one. A duration counts from now. The engine rejects a new expiry that is not later than the current one (`ExpiryNotExtended`). `[pkg: src/actions/wallet/extendEntity.ts:15-21]`. The owner can always extend. Any wallet can extend if the entity was created with `permissionlessExtension`. `[pkg: src/entity/flags.ts:19-23]`, `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`

### 3.5 Expiry units: `ExpirationTime`

`Expiry` is a branded `{ minLifetime: bigint (blocks), expiresAt: bigint | Date }`. A hand-written object or a bare number does not typecheck. The engine resolves it as `max(expiresAt, currentBlock + minLifetime)`. `[pkg: src/entity/expiry.ts:24-33]`

```ts
// [pkg: src/utils/expirationTime.ts:46-156]
ExpirationTime.fromSeconds(n) | fromMinutes | fromHours | fromDays | fromWeeks
ExpirationTime.fromMonths(n)   // 30 days each
ExpirationTime.fromYears(n)    // 365 days each
ExpirationTime.fromBlocks(n)   // exact
ExpirationTime.atBlock(block: bigint, { atLeast?: Lifetime })
ExpirationTime.atDate(date: Date, { atLeast?: Lifetime })   // rounds UP to the next block
ExpirationTime.permanent()     // atBlock(2^64 - 1)
```
- The unit is **blocks of 2 s**. A duration that is not a multiple of 2 s throws `InvalidExpiryError` (for example, `fromSeconds(7)`). `[pkg: src/entity/expiry.ts:150-165]`
- A target at or before the current block throws "dead on arrival". A date in the past also throws. `[pkg: src/entity/expiry.ts:124-129, 174-181]`
- The engine has no maximum lifetime apart from the uint64 width ("there is no MAX_EXPIRES_AT or MAX_LIFETIME"). `[pkg: src/utils/arkivTransactions.ts:73-74]`
- One day is 43,200 blocks. `[doc: https://docs.arkiv.network/typescript-sdk/querying-data/]`
- Gas cost depends on the lifetime: "Over-allocating costs more". `[doc: https://docs.arkiv.network/typescript-sdk/best-practices/]`. **UNVERIFIED**: the actual fee formula.
- For OpenPIL, `atDate(hearingDate)` fits the "awaiting response" lease, and `extendEntity({ expires: ExpirationTime.atDate(newDate) })` fits an adjournment.

### 3.6 Attributes: typing and limits

Typed constructors are in `@arkiv-network/sdk/attr`. `[pkg: src/attr/index.ts]`, `[pkg: src/attr/types.ts:12-36]`

| tag | JS value read back | index | constructor |
|---|---|---|---|
| `bool` | boolean | equality | `bool(b)` or a bare boolean |
| `i32` | number | equality and range | `i32(n)` or **a bare number** |
| `u64` | **bigint** | equality and range | `u64(bigint \| number \| string)` |
| `u256` | **bigint** | equality and range | `u256(...)` or **a bare bigint** |
| `dec` | string (18 dp) | equality and range | `dec("3.5")` |
| `bytes32` | lowercase hex | equality | `bytes32(hex \| Uint8Array)` |
| `str` | string ≤ 128 UTF-8 bytes | equality and prefix | `str(s)` or a bare string |
| `addr` | EIP-55 address | equality | `addr(a)` |
| `key` | hex (an entity reference, may dangle) | equality | `key(k)` |

- Bare value defaults: a `number` becomes `i32`, a `bigint` becomes `u256`, a `string` becomes `str`, a `boolean` becomes `bool`. `[pkg: src/attr/values.ts:395-470]`
- **Type mismatch matches nothing, with no error.** For example, a value written as `u64` does not match a bare `bigint` predicate, because that predicate is `u256`. Always use the same constructor on write and on query. `[pkg: src/attr/values.ts:408-411]`
- Ranges (`gt`, `gte`, `lt`, `lte`) work only on `i32`, `u64`, `u256` and `dec`. `str` supports equality and `startsWith`. `[pkg: src/query/expression.ts:16-17, 109]`
- Store a millisecond timestamp as `u64` (`Date.now()` is above `I32_MAX = 2147483647`). Unix seconds fit `i32` until 2038, but the SDK source recommends `u64` for timestamps. `[pkg: src/attr/values.ts:30, 113-115]`
- Limits:
  - `MAX_ATTRIBUTES = 32` cells per operation, and the payload and contentType use one cell each. The docs say "up to 30" user attributes. `[pkg: src/attr/attributes.ts:11, 109-131]`, `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`
  - `MAX_PAYLOAD_BYTES = 128 * 1024`. `[pkg: src/attr/attributes.ts:17]`
  - `MAX_STRING_BYTES = 128`, with no C0 control characters or DEL. `[pkg: src/attr/values.ts:40, 270-283]`
  - Name grammar: `/^[A-Za-z][A-Za-z0-9._-]*$/`, at most 32 bytes, case sensitive. A name must not start with `$` or contain `--`. Reserved words (case insensitive) are and, or, not, true, false, startswith, exists, typeof, and every type tag (`key`, `str`, and so on). `[pkg: src/attr/names.ts:4-96]`. The docs say names must start with a **lowercase** letter and use lowercase only, but the SDK regex allows uppercase. **UNVERIFIED**: whether the engine rejects uppercase. To be safe, use lowercase names, for example `filedat` or `filed_at`, not `filedAt`.
- Arrays and objects are not supported. Model a list as one entity per item. `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`
- Anything you filter on must be an attribute, because the payload is not queryable. (Hackathon AGENTS.md, "Hard rules for the SDK (0.8)")

### 3.7 Creation flags, `$creator` vs `$owner`, changeOwnership

```ts
// [pkg: src/entity/flags.ts:13-24]
type CreationFlags = { readonly?: boolean; permissionlessExtension?: boolean }  // both default false
```
- These are the only two flags. Bits 2 to 7 are reserved and must be zero (engine error `ReservedCreationFlags`). The flags never change after creation. `[pkg: src/entity/flags.ts:3-11]`, `[pkg: src/utils/arkivTransactions.ts:72]`
- `readonly` freezes attributes and payload. The owner can still extend, transfer and delete. `[pkg: src/entity/flags.ts:15-18]`
- `permissionlessExtension` lets anyone extend, but only the owner can change the entity. `[pkg: src/entity/flags.ts:19-23]`
- Read the flags back with `select({ creationFlags: true })`, which returns `{ readonly, permissionlessExtension, raw }`. `[pkg: src/types/entity.ts:19-20]`

`$creator` vs `$owner`: `$creator` is the account that created the entity and never changes. `$owner` changes when ownership is transferred and controls writes. `createdBy(addr)` and `ownedBy(addr)` are shorthands for `eq("$creator", addr(x))` and `eq("$owner", addr(x))`. `[pkg: src/query/queryBuilder.ts:81-95]`. Use `$creator` for trust, because "nobody can fake `$creator`". `[doc: https://docs.arkiv.network/typescript-sdk/best-practices/]`

```ts
// [pkg: src/actions/wallet/changeOwnership.ts:14-43]
changeOwnership({ entityKey: Hex, newOwner: Hex }, txParams?): Promise<{ entityKey: Hex; txHash: Hash }>
```
The caller must be the current owner (`NotOwner`). Transfers to the zero address or to yourself revert. `[pkg: src/utils/arkivTransactions.ts:70, 78-79]`. After a transfer, the old owner can no longer patch, extend or delete. `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`

Keys: by default a random 128-bit salt makes the key unpredictable. Pass `salt: NO_SALT` for a key derived from `(chainId, ARKIV_ADDRESS, owner, nonce)` only. `[pkg: src/actions/wallet/createEntity.ts:83-89]`, `[pkg: src/entity/key.ts:64-88]`

### 3.8 Atomic batch: `executeBatch`

```ts
// [pkg: src/actions/wallet/executeBatch.ts:20-47]
type ExecuteBatchParameters = {
  creates?: CreateEntityParameters[]
  patches?: PatchEntityParameters[]
  deletes?: DeleteEntityParameters[]
  extensions?: ExtendEntityParameters[]
  ownershipChanges?: ChangeOwnershipParameters[]
}
type ExecuteBatchReturnType = {
  txHash: Hash; createdEntities: Hex[]; patchedEntities: Hex[]; deletedEntities: Hex[];
  extendedEntities: Hex[]; ownershipChanges: Hex[]
}
```
- The batch is one transaction to `execute(operations)`, so either every operation applies or none does. An empty batch throws. `[pkg: src/clients/decorators/arkivWallet.ts:215-216]`, `[pkg: src/utils/arkivTransactions.ts:165-167]`
- **Fixed order of operations**: creates, then patches, then deletes, then extensions, then ownershipChanges. The order you write keys in the object does not matter. `[pkg: src/utils/arkivTransactions.ts:152-163]`, `[doc: https://docs.arkiv.network/typescript-sdk/mutating-data/]`
- To make a create reference another create in the same batch, use `predictEntityKeys({ owner, count })` and pass each predicted `salt`. The prediction holds only while no other transaction from that owner is in flight. `[pkg: src/clients/decorators/arkivPublic.ts:210-250]`
- The batch size limit is not documented. **UNVERIFIED**.
- OpenPIL "respond and close the pending lease" works as one batch: `executeBatch({ creates: [response], deletes: [{ entityKey: pendingKey }] })`. This needs the **same wallet to own the pending entity**. If the filer owns it, the respondent cannot delete it (`NotOwner`). Design the pending entity's ownership with this in mind (for example, create it already owned by the respondent with `changeOwnership` in the same batch, or let the respondent create it). This is an inference from the owner rules, not a documented pattern.

## 4. Queries

### 4.1 Builder

```ts
// [pkg: src/clients/decorators/arkivPublic.ts:105-133], [pkg: src/query/queryBuilder.ts:42-191]
client.select(selection?: "*" | EntitySelection): SelectQueryBuilder<...>
  .where(...expressions: Expression[])   // AND across args and repeated calls
  .ownedBy(owner: Hex)                   // $owner = addr(owner)
  .createdBy(creator: Hex)               // $creator = addr(creator)
  .limit(n)                              // 1..200, otherwise the node default (100 on Tiramisu)
  .cursor(c: string)                     // resume
  .atBlock(block: bigint)                // historical read, limited by node retention
  .fetch(): Promise<QueryResult>         // { entities, blockNumber: bigint, cursor?: string, hasNextPage(), next() }
// also: for await (const e of builder) { ... } walks every page
```
Combinators come from `@arkiv-network/sdk/query`: `eq, ne, gt, gte, lt, lte, startsWith, exists, hasType, not, and, or`. `[pkg: src/query/index.ts:18-32]`

```ts
import { and, eq, lt, or, gte } from "@arkiv-network/sdk/query"
import { u64 } from "@arkiv-network/sdk/attr"
const page = await publicClient
  .select({ key: true, creator: true, expiresAt: true, attributes: true })
  .where(eq("project", "openpil-xyz"), eq("type", "pending"), lt("hearingdate", u64(nowMs)))
  .createdBy(verifiedWallet)
  .limit(50)
  .fetch()
if (page.hasNextPage()) { const p2 = await page.next() }
```

### 4.2 Projection (the 0.8 replacement for withPayload, withAttributes, withMetadata)

Selection fields: `key, owner, creator, createdAt, updatedAt, expiresAt, creationFlags, contentType, payload, attributeSchema, attributes`. `attributes` can also be a map of names, for example `{ attributes: { court: true } }`. Every field is opt in, **including `key`**. `select()` or `select("*")` returns everything. `select({})` or a selection where every field is false throws. `[pkg: src/query/selection.ts:10-128]`. Declare the selection inline or with `as const`, or the result type does not narrow. `[pkg: src/clients/decorators/arkivPublic.ts:118-120]`

Returned `Entity` fields: `createdAt`, `updatedAt` and `expiresAt` are **bigint block numbers**, not timestamps. `attributes` is `Record<name, { type, value }>`. `[pkg: src/types/entity.ts:9-27]`

`getEntity(key)` selects `"*"`. It throws `NoEntityFoundError` for a key that never existed, was deleted, or **has expired**. `[pkg: src/actions/public/getEntity.ts:17-34]`

Raw alternative: `client.query(exprOrString, { select, limit, cursor, atBlock })` returns `{ entities, cursor, blockNumber }`. A raw string skips the SDK checks. `[pkg: src/actions/public/query.ts:7-47]`

### 4.3 Query rules and gotchas

- **At least one filter is required.** The language cannot express "match everything". `[pkg: src/query/queryBuilder.ts:141-146]`, `[live]` error message confirmed.
- **No orderBy.** Results come back newest first. `limit` applies before any client-side sort, so a true top N needs a walk over every page. `[doc: https://docs.arkiv.network/typescript-sdk/querying-data/]`. `[live]`: a page showed `createdAt` descending (740869, 740869, 740868, 740867, 740867).
- Queryable system attributes: `$key` (key), `$owner` and `$creator` (addr), and `$expiresAt` (u64). `$createdAt`, `$updatedAt`, `$creationFlags`, `$contentType` and `$payload` are result only. `[pkg: src/query/expression.ts:85-106]`. `[live]`: `gt("$createdAt", u64(1))` throws `InvalidPredicateError` in the SDK, **but** the raw string `"$createdAt > u64(1)"` sent through `client.query(...)` or JSON-RPC was **accepted** by the node and returned a row. This conflicts with the docs, and the hackathon AGENTS.md says "range-filter on `$createdAt`". Use a user-defined `u64` timestamp attribute instead. This is a possible friction.md item.
- `ne()` and `exists()` are in the SDK, but the node rejects them. `[live]` messages: `"!= is not part of the query language — write NOT (attr = value) for the complement"` and `"exists(…) is not supported — the index has no per-attribute presence set in this version"`. The docs say the same for `hasType()`. `[doc: https://docs.arkiv.network/typescript-sdk/querying-data/]`. `not(eq(...))` works `[live]`, but it also matches entities that do not have the attribute, so scope it with an `eq` on another attribute.
- A cursor is bound to its query, block and selection. When the node stops retaining that block, the cursor expires and throws `QueryError` with `kind === "cursor"`. `[pkg: src/query/queryResult.ts:61-64]`
- `getEntityCount()` counts entities chain wide and takes no filter. `[doc: https://docs.arkiv.network/typescript-sdk/querying-data/]`
- Every query should carry a unique `project` attribute, because the database is shared and public. Combine it with `createdBy()` for trust, because anyone can copy the project tag. `[doc: https://docs.arkiv.network/typescript-sdk/best-practices/]`

## 5. Live events: `watchEntityEvents`

```ts
// [pkg: src/actions/public/watchEntityEvents.ts:32-57, 86-180]
type WatchEntityEventsParameters = {
  onEntityCreated?, onEntityPatched?, onExpiryExtended?, onOwnershipTransferred?, onEntityDeleted?,
  onEvent?: (e: EntityEvent) => void      // every event; runs before the typed handler
  onError?: (err: Error) => void          // default console.error
  fromBlock?: bigint                      // replay; FORCES POLLING
  pollingInterval?: number                // ms, default 1000 (half a block)
}
watchEntityEvents(params): () => void      // returns unwatch synchronously; do not await
```
Event shapes (all include `blockNumber: bigint`, `transactionHash: Hex` and `logIndex: number`). `[pkg: src/types/events.ts:11-81]`

```ts
{ type: "EntityCreated", entityKey, owner, expiresAt: bigint, creationFlags: { readonly, permissionlessExtension, raw } }
{ type: "EntityPatched", entityKey, owner }                 // does not say what changed: re-read the entity
{ type: "ExpiryExtended", entityKey, owner, expiresAt }     // owner, NOT the extender
{ type: "OwnershipTransferred", entityKey, previousOwner, newOwner }
{ type: "EntityDeleted", entityKey, owner }                 // explicit delete only
```
- **Expiry emits no event.** To detect an expiry, query, or catch `NoEntityFoundError`. `[doc: https://docs.arkiv.network/typescript-sdk/live-events/]`. The ABI has only the five events above. `[pkg: src/entity/events.ts:7-13]`
- Events carry **no attributes and no creator**. The watcher sees **all** Arkiv events chain wide (it filters only on `ARKIV_ADDRESS`), so the app must fetch each `entityKey` to check its `project`, `$creator` and so on. `[pkg: src/actions/public/watchEntityEvents.ts:141-149]`. `[live]`: about 10 unrelated events in 12 s on 18 October, mostly from other projects.
- Transport: viem `watchEvent` uses `eth_subscribe` ("logs") only when the transport is `webSocket` (or `ipc`, or a `fallback` whose first transport is WebSocket) **and** `fromBlock` is not set. Otherwise it polls. `[viem: actions/public/watchEvent.ts:176-191, 307-345]`. The SDK passes `pollingInterval` and never passes `poll`, so `webSocket()` with no `fromBlock` gives a real socket. The rubric wants exactly this. `[doc: hackathon docs/scoring-rubric.md "WebSocket entity events"]`. `[live]`: a Node 22 run with `transport: webSocket()` delivered decoded events.
- **UNVERIFIED**: reconnect behaviour after a socket drop (viem's WebSocket transport has reconnect options, but I did not check them for this brief). Have `onError` show a "reconnecting" state, and re-query on reconnect.

## 6. Browser only, no backend: what works and what to watch

- **CORS on the RPC is open.** `[live]`: a preflight `OPTIONS` with `Origin: https://example.vercel.app` returned `204`, `access-control-allow-origin: *`, `access-control-allow-methods: POST, OPTIONS` and `access-control-allow-headers: Content-Type, Authorization, X-Api-Key`. A POST returned `access-control-allow-origin: *` and exposed `RateLimit, Retry-After, Arkiv-Quota-Used-Percent, Arkiv-Cost`. So a static Next.js site can query Arkiv directly from the browser.
- **Rate limit.** `[live]`, anonymous: `ratelimit: limit=600, remaining=599, reset=60` (about 600 units per 60 s per client, **UNVERIFIED** whether per IP). Each `arkiv_query` reported `arkiv-cost: 100`, so roughly **6 queries per minute** anonymously if the cost unit counts against the 600. **UNVERIFIED**: how cost maps onto the limit. The docs say the public RPC "is heavily rate limited". `[doc: https://docs.arkiv.network/typescript-sdk/querying-data/]`. Design for few queries: use narrow `select`, cache with TanStack Query, avoid N+1 lookups per event, and back off on HTTP 429 or `Retry-After`. Do not ship an access key in the browser. `[doc: https://docs.arkiv.network/start-here/access-keys/]`
- **Next.js and SSR.** The SDK has no `window` dependency at import time. The logger reads `process.env.DEBUG` or `localStorage.DEBUG` behind guards. `randomSalt()` needs `globalThis.crypto.getRandomValues`, which browsers and Node 18+ provide. `[pkg: src/utils/logger.ts:7-23]`, `[pkg: src/entity/key.ts:30-41]`. Put wallet code (`window.ethereum`) and `watchEntityEvents` in `"use client"` components or effects only. `package.json` requires `engines.node >=18` and has `sideEffects: false`. `brotli-wasm` is a listed dependency, but the built `dist/*.js` does not import it (grep found no matches), so no WASM bundling is needed. **UNVERIFIED**: an actual `next build` with this package. Test it early.
- **BigInt.** Block numbers, `u64`/`u256` values, `expiresAt` and `blockNumber` are `bigint`. `JSON.stringify` throws `TypeError` on BigInt (**general web fact**). This matters for TanStack Query keys, `localStorage` and props passed from Server to Client Components (**UNVERIFIED** in React version terms). Convert with `.toString()` at boundaries. To show a wall-clock time for a block number, use `getBlockTiming()` (returns `{ currentBlock: bigint, currentBlockTime: number (unix s), blockDuration: number }`) and compute `currentBlockTime + (block - currentBlock) * 2`. `[pkg: src/actions/public/getBlockTiming.ts:6-23]`
- **Parallel writes.** Do not `Promise.all` writes from one wallet, because nonces collide. Use one batch instead. `[doc: https://docs.arkiv.network/typescript-sdk/best-practices/]`
- **The SDK does not retry, and `entity.toJson()` returns `any`.** Validate payloads (for example with Zod). `[doc: https://docs.arkiv.network/typescript-sdk/best-practices/]`
- **React lists.** Use the entity key as the React key, and use TanStack Query or SWR rather than `useEffect` fetching. `[doc: https://docs.arkiv.network/typescript-sdk/react-integration/]`
- **Hashing a PDF in the browser.** `crypto.subtle.digest("SHA-256", await file.arrayBuffer())` gives 32 bytes, which fit `bytes32(new Uint8Array(digest))` for an `eq` lookup. **General web fact**: SubtleCrypto needs a secure context (HTTPS or localhost).

## 7. Fetching `/.well-known/...` on another domain from the browser (general web fact, not Arkiv)

- A browser `fetch("https://ngo.example/.well-known/arkiv.txt")` from your origin is a cross-origin request. The browser lets JavaScript read the response **only if** the target server sends `Access-Control-Allow-Origin` with your origin or `*`. A plain GET with no custom headers is a "simple request" and needs no preflight, but the response is still blocked if that header is missing. Most sites do not send CORS headers on arbitrary static files, so expect failures by default. **General web fact (Fetch standard and CORS), not verified per domain.**
- `mode: "no-cors"` returns an opaque response whose body you cannot read, so it is no use for verification. **General web fact.**
- Options, each with a trust tradeoff for the spec writer:
  1. The organisation configures its server to send `Access-Control-Allow-Origin: *` for that one file. This is easy on most hosts, but it is an extra step for them.
  2. A CORS proxy or your own edge function. This adds a backend, which weakens the "no team backend" Censorship Resistance claim. Make it optional, so anyone can re-verify with `curl`.
  3. A DNS TXT record read through a public DNS-over-HTTPS JSON API (for example Cloudflare `https://cloudflare-dns.com/dns-query?name=...&type=TXT` with `accept: application/dns-json`). **UNVERIFIED**: whether that endpoint sends CORS headers. Test it before relying on it.
  4. The fallback in `openpil.md`: a signed registry entity on Arkiv, trusted via `$creator`.
- Whatever the method, treat the domain to wallet link as "verified at time T by this client". Show the method in the UI.

## 8. Hackathon facts that affect design (from `Arkiv-Network/global-tour-stop-pre-devcon`)

- The rubric's "How you use Arkiv" table lists these features: typed attributes vs payload, compound and range queries with `createdBy()`/`ownedBy()` and cursor pagination, expiry per type, `extendEntity` as a lease, creation flags (permissionless extension), `$creator`/`$owner` in the UX plus transfer, `watchEntityEvents` over WebSocket with no `fromBlock`, and atomic batches. Usage is "checked on chain and in the code; a feature claimed but not found counts against you". `[doc: docs/scoring-rubric.md]`
- Censorship Resistance test: "someone outside the team can read and query the data from Arkiv without the team's backend." Security test: filter by on-chain `$creator`. `[doc: docs/scoring-rubric.md]`
- Gate "Evidence that survives expiry": if entities expire before judging (19 to 22 October), judges fall back to creation transactions and the video. Seed demo entities with lifetimes that cover judging and winner announcement (23 October). `[doc: docs/scoring-rubric.md]`
- Required: `/arkiv/schema.md`, `/arkiv/friction.md`, entity-creating wallet addresses in the README, MIT licence, demo video of 3 minutes or less. The form also asks "Arkiv surfaces you used" (SDK, JSON-RPC, WebSocket events, Faucet, Access keys, Explorer, and so on). `[doc: docs/submission-checklist.md]`
- Vocabulary from AGENTS.md: say "Entity Expiration" and "Lifetime Extension", never "TTL". Describe Arkiv as "the Web3 database" and its records as "Arkiv entities". `[doc: AGENTS.md]`
- No real personal data, secrets or keys on Arkiv, in plaintext or hashed. Use synthetic data. `[doc: docs/scoring-rubric.md "Not eligible"]`

## 9. Friction candidates seen while researching (real, reproducible)

1. `$createdAt` filter. The SDK `gt("$createdAt", u64(1))` throws `InvalidPredicateError` ("carries no index"), but the raw query `"$createdAt > u64(1)"` is accepted by the Tiramisu node, and AGENTS.md advises range filtering on it. Versions: sdk 0.8.1, Tiramisu on 18 October 2026.
2. `ne()`, `exists()` and `hasType()` are exported by the SDK, but the node rejects them at runtime (error strings in section 4.3).
3. Attribute name case. The docs say lowercase only, but the SDK regex accepts uppercase (`src/attr/names.ts:13`).
4. Rate limit headers. An anonymous `arkiv_query` costs 100 against `limit=600` per 60 s. This is not documented in numbers.
5. `watchEntityEvents` cannot be filtered by project, creator or attribute, so a browser app must re-query every event and burns the rate limit.

Before you write any of these into `friction.md`, re-run each check during the build with exact steps. Invented complaints score 0.
