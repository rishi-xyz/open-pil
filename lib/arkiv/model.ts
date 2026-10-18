import { u64 } from "@arkiv-network/sdk/attr";
import { z } from "zod";
export const APP = "openpil";
export const ENTITY_TYPES = ["petition", "review", "extension", "decision", "org"] as const;
export const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform(v => v.toLowerCase());
export const hashSchema = z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform(v => v.toLowerCase());
export const markdownSchema = z.string().min(1).refine(v => new TextEncoder().encode(v).length <= 32 * 1024, "Markdown exceeds 32 KB");
export const titleSchema = z.string().trim().min(1).refine(v => new TextEncoder().encode(v).length <= 120, "Title exceeds 120 bytes");
export const outcomeSchema = z.enum(["accepted", "rejected"]);
export const payloadSchemas = {
  petition: markdownSchema, review: z.object({}).strict(), extension: markdownSchema, decision: markdownSchema,
  org: z.object({ name: z.string().min(1), about: z.string(), website: z.url().optional() }),
};
export const orgAttributes = (wallet: string, role: "court", court?: string) => ({ app: APP, type: "org", wallet: addressSchema.parse(wallet), role, ...(court ? { court } : {}) });

export type PetitionAttributes = { title: string; court: string; filedat: number; duedate: number };
export const petitionAttributes = (v: PetitionAttributes) => ({ app: APP, type: "petition", title: titleSchema.parse(v.title), court: z.string().min(1).parse(v.court), filedat: u64(v.filedat), duedate: u64(v.duedate) });
export const reviewAttributes = (petition: string, court: string, due: number, extensions = 0) => ({ app: APP, type: "review", petition: hashSchema.parse(petition), court: addressSchema.parse(court), duedate: u64(due), extensions });
export const extensionAttributes = (petition: string, due: number) => ({ app: APP, type: "extension", petition: hashSchema.parse(petition), newdue: u64(due) });
export const decisionAttributes = (petition: string, outcome: "accepted" | "rejected", now: number) => ({ app: APP, type: "decision", petition: hashSchema.parse(petition), outcome: outcomeSchema.parse(outcome), decidedat: u64(now) });

const timestampSchema = z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).refine(v => Number.isSafeInteger(Number(v)));
export const revision3AttributeSchemas = {
  petition: z.object({ title: titleSchema, court: z.string().min(1), filedat: timestampSchema, duedate: timestampSchema }),
  review: z.object({ petition: hashSchema, court: addressSchema, duedate: timestampSchema, extensions: z.number().int().nonnegative() }),
  extension: z.object({ petition: hashSchema, newdue: timestampSchema }),
  decision: z.object({ petition: hashSchema, outcome: outcomeSchema, decidedat: timestampSchema }),
};
