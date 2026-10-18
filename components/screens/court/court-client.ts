import type { CourtAction, CourtRequest } from "@/lib/arkiv/court/schema";
export type CourtResult = { action: CourtAction; txHash: string; entityKey: string };
const fallback: Record<number, string> = { 403: "The request was not accepted from this origin.", 409: "The petition changed on Arkiv. Recheck it before trying again.", 413: "The reason is too large.", 429: "Too many court actions. Wait a minute and try again.", 503: "The demo court is not configured on this deployment." };
export function courtErrorMessage(status: number, body: unknown) {
  const error = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : undefined;
  return error ?? fallback[status] ?? "The court action failed.";
}
// Same origin POST; the server signs with the court key and never returns provider errors.
export async function submitCourtAction<A extends CourtAction>(action: A, request: CourtRequest<A>, fetcher: typeof fetch = fetch): Promise<CourtResult> {
  const response = await fetcher(`/api/court/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), credentials: "same-origin" });
  let body: unknown;
  try { body = await response.json(); } catch { body = undefined; }
  if (!response.ok) throw new Error(courtErrorMessage(response.status, body));
  const result = body as Partial<CourtResult>;
  if (typeof result?.txHash !== "string" || typeof result?.entityKey !== "string") throw new Error("The court returned an unexpected response.");
  return { action, txHash: result.txHash, entityKey: result.entityKey };
}
