import type { Address, Hex } from "viem";
import type { ArkivWallet } from "../clients";
import { decisionBatch } from "../writes/decide";
import { extensionBatch } from "../writes/extend-review";
import { DECISION_EXISTS, NOT_REGISTERED_COURT } from "../writes/review-context";
import { courtGuard, type GuardContext } from "./guard";
import { sameOrigin } from "./origin";
import { clientIp, type RateLimiter } from "./rate-limit";
import type { WriteQueue } from "./queue";
import { MAX_COURT_BODY_BYTES, parseCourtRequest, type CourtAction } from "./schema";
export type CourtDeps = {
  signer: Pick<ArkivWallet, "executeBatch"> & { account: { address: Address } };
  readContext: (petition: Hex) => Promise<GuardContext>;
  attempts: RateLimiter;
  writes: RateLimiter;
  queue: WriteQueue;
};
class Conflict extends Error {}
const conflicts = new Set([NOT_REGISTERED_COURT, DECISION_EXISTS]);
export const fail = (status: number, error: string, headers?: HeadersInit) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });
async function readBody(request: Request): Promise<{ body: unknown } | { response: Response }> {
  if (Number(request.headers.get("content-length")) > MAX_COURT_BODY_BYTES) return { response: fail(413, "Request body too large") };
  const reader = request.body?.getReader();
  if (!reader) return { response: fail(400, "Invalid JSON") };
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_COURT_BODY_BYTES) { await reader.cancel(); return { response: fail(413, "Request body too large") }; }
      chunks.push(value);
    }
  } catch { return { response: fail(400, "Invalid request body") }; }
  finally { reader.releaseLock(); }
  try { return { body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))) }; }
  catch { return { response: fail(400, "Invalid JSON") }; }
}
// Order: same origin, attempt limit, bounded body, schema, write limit, then one serialized read, check and sign.
export function courtHandler(action: CourtAction, deps: CourtDeps) {
  return async (request: Request): Promise<Response> => {
    if (!sameOrigin(request)) return fail(403, "Cross origin requests are not allowed");
    const ip = clientIp(request.headers);
    const attempt = deps.attempts.allow(ip);
    if (!attempt.ok) return fail(429, "Too many requests", { "Retry-After": String(attempt.retryAfter) });
    const read = await readBody(request);
    if ("response" in read) return read.response;
    const parsed = parseCourtRequest(action, read.body);
    if ("error" in parsed) return fail(400, parsed.error);
    const write = deps.writes.allow(ip);
    if (!write.ok) return fail(429, "Too many court actions", { "Retry-After": String(write.retryAfter) });
    const input = parsed.data;
    const court = deps.signer.account.address;
    try {
      const result = await deps.queue(court.toLowerCase(), async () => {
        let context: GuardContext;
        try { context = await deps.readContext(input.petition as Hex); }
        catch (error) { throw error instanceof Error && conflicts.has(error.message) ? new Conflict(error.message) : new Error("read", { cause: error }); }
        const refusal = courtGuard(context, court, action, input);
        if (refusal) throw new Conflict(refusal);
        const batch = action === "decide" ? decisionBatch(context, court, input.petition as Hex, (input as { outcome: "accepted" | "rejected" }).outcome, input.reason) : extensionBatch(context, court, input.petition as Hex, (input as { due: number }).due, input.reason);
        return deps.signer.executeBatch(batch);
      });
      return Response.json({ action, txHash: result.txHash, entityKey: result.createdEntities[0] }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof Conflict) return fail(409, error.message);
      if (error instanceof Error && error.message === "read") return fail(502, "Could not read the petition from Arkiv");
      const txHash = error && typeof error === "object" && "txHash" in error && typeof error.txHash === "string" ? error.txHash : undefined;
      return Response.json({ error: "The court transaction did not confirm. Recheck the petition before trying again.", ...(txHash ? { txHash } : {}) }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
  };
}
