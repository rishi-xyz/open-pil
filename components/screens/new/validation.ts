import { markdownSchema, titleSchema } from "@/lib/arkiv/model";
export const byteLength = (value: string) => new TextEncoder().encode(value).length;
export function validatePetition(title: string, body: string, due: string, now: number) {
  const parsedTitle = titleSchema.parse(title);
  if (!body.trim()) throw new Error("Write a petition body");
  markdownSchema.parse(body);
  const duedate = new Date(`${due}T23:59:59`).getTime();
  if (!dueDateValid(due, now)) throw new Error("Choose a date after today.");
  return { title: parsedTitle, duedate };
}

export function dueDateValid(due: string, now: number) {
  const selected = new Date(`${due}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Number.isFinite(selected.getTime()) && selected.getTime() > today.getTime();
}
