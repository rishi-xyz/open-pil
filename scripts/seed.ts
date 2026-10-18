import { readFile, writeFile } from "node:fs/promises";
import { createWalletClient, ExpirationTime, jsonToPayload } from "@arkiv-network/sdk";
import { eq } from "@arkiv-network/sdk/query";
import { u64 } from "@arkiv-network/sdk/attr";
import type { Hex } from "viem";
import { nonceManager, privateKeyToAccount } from "viem/accounts";
import { tiramisu } from "../lib/arkiv/chain";
import { publicClient, scriptTransport } from "./arkiv-clients";
import { orgAttributes, petitionAttributes, reviewAttributes, decisionAttributes, extensionAttributes, markdownSchema } from "../lib/arkiv/model";
import { markdownEntity } from "../lib/arkiv/writes/markdown";
import { persistentEntity } from "../lib/arkiv/writes/entity";
import { cases, organisations, petitioners } from "./seed/data";
const path = new URL("./seed-output.json", import.meta.url);
function wallet(name: string) {
  const key = process.env[name];
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error(`Set ${name} to a funded test key`);
  return createWalletClient({ chain: tiramisu, transport: scriptTransport(), account: privateKeyToAccount(key as Hex, { nonceManager }) });
}
type Entry = { petition: Hex; review?: Hex; decision?: Hex; extension?: Hex; txHashes: Hex[]; complete?: boolean };
async function main() {
  const label = process.argv[2] ?? process.env.SEED_RUN_LABEL ?? "openpil-demo-r3";
  if (!/^[\w-]{1,64}$/.test(label)) throw new Error("Invalid run label");
  const registry = wallet("REGISTRY_PRIVATE_KEY"), court = wallet(organisations[0].env);
  const filers = new Map(petitioners.map(p => [p.id as string, wallet(p.env)]));
  if (new Set([registry, court, ...filers.values()].map(w => w.account.address.toLowerCase())).size !== 4) throw new Error("Use four distinct wallets");
  for (const item of cases) markdownSchema.parse(item.body);
  if (await publicClient.getChainId() !== tiramisu.id) throw new Error("Expected Tiramisu");
  let output: Record<string, unknown> = {};
  try { output = JSON.parse(await readFile(path, "utf8")); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
  const run = (output[label] ??= { registry: registry.account.address, cases: {} }) as { registry: string; court?: { key: Hex; txHash: Hex | null }; cases: Record<string, Entry> };
  if (run.registry.toLowerCase() !== registry.account.address.toLowerCase()) throw new Error("Registry mismatch");
  const save = () => writeFile(path, JSON.stringify(output, null, 2) + "\n");
  const org = organisations[0];
  const existing = await publicClient.select("*").where(eq("app", "openpil"), eq("type", "org"), eq("role", "court"), eq("court", org.court), eq("wallet", court.account.address.toLowerCase())).createdBy(registry.account.address).limit(1).fetch();
  if (!existing.entities.length) {
    const registered = await registry.createEntity(persistentEntity(orgAttributes(court.account.address, "court", org.court), { name: org.name, about: org.about }));
    run.court = { key: registered.entityKey, txHash: registered.txHash };
  } else if (run.court?.key !== existing.entities[0].key) run.court = { key: existing.entities[0].key!, txHash: null };
  await save();
  for (const item of cases) {
    if (run.cases[item.id]?.complete) continue;
    if (run.cases[item.id]) throw new Error(`Reconcile incomplete ${item.id} before continuing`);
    const filer = filers.get(item.petitioner)!;
    const found = await publicClient.select({ key: true }).where(eq("app", "openpil"), eq("type", "petition"), eq("title", item.title)).createdBy(filer.account.address).limit(1).fetch();
    if (found.entities.length) throw new Error(`Existing ${item.id}: reconcile output or unseed first`);
    const now = Date.now(), due = now + (item.state === "expired" ? -2 : 7) * 86400000;
    const [p, r] = await publicClient.predictEntityKeys({ owner: filer.account.address, count: 2 });
    const petition = { ...markdownEntity(petitionAttributes({ title: item.title, court: "VPHC", filedat: now, duedate: due }), item.body), salt: p.salt };
    const result = await filer.executeBatch({ creates: item.state === "expired" ? [petition] : [petition, { attributes: reviewAttributes(p.key, court.account.address, due), payload: jsonToPayload({}), contentType: "application/json", expires: ExpirationTime.atDate(new Date(due)), salt: r.salt }], ownershipChanges: item.state === "expired" ? undefined : [{ entityKey: r.key, newOwner: court.account.address }] });
    const entry: Entry = run.cases[item.id] = { petition: result.createdEntities[0], review: result.createdEntities[1], txHashes: [result.txHash] };
    await save();
    if (entry.petition !== p.key || (item.state !== "expired" && entry.review !== r.key)) throw new Error("Prediction mismatch");
    if (item.extension) {
      const nextDue = due + 7 * 86400000;
      const extension = await court.executeBatch({ creates: [markdownEntity(extensionAttributes(p.key, nextDue), item.extensionReason!)], patches: [{ entityKey: r.key, set: { duedate: u64(nextDue), extensions: 1 } }], extensions: [{ entityKey: r.key, expires: ExpirationTime.atDate(new Date(nextDue)) }] });
      entry.extension = extension.createdEntities[0]; entry.txHashes.push(extension.txHash); await save();
    }
    if (item.state === "accepted" || item.state === "rejected") {
      const decision = await court.executeBatch({ creates: [markdownEntity(decisionAttributes(p.key, item.state, Date.now()), item.decisionReason!)], deletes: [{ entityKey: r.key }] });
      entry.decision = decision.createdEntities[0]; entry.txHashes.push(decision.txHash); await save();
    }
    entry.complete = true; await save(); console.log(`${item.id}: ${entry.petition}`);
  }
}
main().catch(() => { console.error("Seed stopped. Reconcile the last attempted transaction and saved output before rerunning; no writes were retried."); process.exitCode = 1; });
