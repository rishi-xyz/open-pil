import { z } from "zod";
import { hashSchema, markdownSchema, outcomeSchema } from "../model";
// JSON escaping can grow a 32 KB markdown reason; 96 KB leaves room without inviting large bodies.
export const MAX_COURT_BODY_BYTES = 96 * 1024;
export const decideSchema = z.object({ petition: hashSchema, outcome: outcomeSchema, reason: markdownSchema }).strict();
export const extendSchema = z.object({ petition: hashSchema, due: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), reason: markdownSchema }).strict();
export const courtSchemas = { decide: decideSchema, extend: extendSchema } as const;
export type CourtAction = keyof typeof courtSchemas;
export type CourtRequest<A extends CourtAction = CourtAction> = z.infer<(typeof courtSchemas)[A]>;
export function parseCourtRequest<A extends CourtAction>(action: A, body: unknown): { data: CourtRequest<A> } | { error: string } {
  const result = courtSchemas[action].safeParse(body);
  if (result.success) return { data: result.data as CourtRequest<A> };
  const issue = result.error.issues[0];
  return { error: issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request" };
}
