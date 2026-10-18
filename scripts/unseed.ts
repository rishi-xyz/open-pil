import { createWalletClient, EntityMutationError } from "@arkiv-network/sdk";
import { eq } from "@arkiv-network/sdk/query";
import { type Hex } from "viem";
import { nonceManager, privateKeyToAccount } from "viem/accounts";
import { APP } from "../lib/arkiv/model";
import { tiramisu } from "../lib/arkiv/chain";
import { publicClient, scriptTransport } from "./arkiv-clients";
import { organisations, petitioners } from "./seed/data";

async function main() {
  const names = [...(process.env.ORG_STATE_DEPT_PRIVATE_KEY ? ["ORG_STATE_DEPT_PRIVATE_KEY"] : []), "REGISTRY_PRIVATE_KEY", ...petitioners.map(item => item.env), ...organisations.map(item => item.env)];
  const wallets = names.map(name => {
    const key = process.env[name];
    if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error(`Set ${name} to a funded test key`);
    return createWalletClient({ chain: tiramisu, transport: scriptTransport(), account: privateKeyToAccount(key as Hex, { nonceManager }) });
  });
  if (new Set(wallets.map(wallet => wallet.account.address.toLowerCase())).size !== wallets.length) throw new Error("Use distinct seed wallets");
  if (await publicClient.getChainId() !== tiramisu.id) throw new Error("Expected Tiramisu");
  const block = await publicClient.getBlockNumber();
  // No type filter: also remove legacy pil, pending, response and adjournment entities.
  const plans = [];
  for (const wallet of wallets) {
    const keys: Hex[] = [];
    for await (const entity of publicClient.select({ key: true }).where(eq("app", APP)).ownedBy(wallet.account.address).atBlock(block).limit(50)) keys.push(entity.key);
    plans.push({ wallet, keys });
  }
  console.log(`Tiramisu: deleting ${plans.reduce((count, plan) => count + plan.keys.length, 0)} live OpenPIL entities owned by seed wallets (including registry orgs).`);
  for (const { wallet, keys } of plans) {
    for (const key of keys) {
      // Recheck current ownership and expiration after the snapshot walk, before submitting.
      const entity = await publicClient.getEntity(key);
      if (entity.owner.toLowerCase() !== wallet.account.address.toLowerCase()) throw new Error(`Owner changed for ${key}; stopped`);
      if (entity.expiresAt <= await publicClient.getBlockNumber()) continue;
      console.log(`Deleting ${key} by ${wallet.account.address}`);
      try {
        const result = await wallet.deleteEntity({ entityKey: key });
        console.log(`${key}: ${result.txHash}`);
      } catch (error) {
        if (error instanceof EntityMutationError && error.txHash) console.error(`Reconcile transaction ${error.txHash} before rerunning.`);
        throw error;
      }
    }
  }
}
main().catch(() => {
  console.error("Unseed stopped. Reconcile the last attempted deletion before rerunning; no writes were retried. Check environment keys, ownership, expiration and RPC availability.");
  process.exitCode = 1;
});
