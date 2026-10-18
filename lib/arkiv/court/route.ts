import "server-only";
import type { Hex } from "viem";
import { reviewContext } from "../writes/review-context";
import { courtHandler, fail } from "./handler";
import { writeQueue } from "./queue";
import { createRateLimiter } from "./rate-limit";
import type { CourtAction } from "./schema";
import { courtClients, registryAddress } from "./signer";
// Invalid attempts consume only the attempt budget; validated requests also consume the write budget.
const attempts = createRateLimiter({ limit: 30, windowMs: 60_000 });
const writes = createRateLimiter({ limit: 5, windowMs: 60_000 });
export function courtRoute(action: CourtAction) {
  return async (request: Request) => {
    const clients = courtClients();
    const registry = registryAddress();
    if (!clients || !registry) return fail(503, "The demo court is not configured");
    const { reader, signer } = clients;
    return courtHandler(action, { signer, readContext: (petition: Hex) => reviewContext(signer, petition, registry, reader), attempts, writes, queue: writeQueue })(request);
  };
}
