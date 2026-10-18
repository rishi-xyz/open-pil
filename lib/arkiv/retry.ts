export function isRateLimited(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; message?: string; cause?: unknown };
  return e.status === 429 || /429|rate.?limit/i.test(e.message ?? "") || (e.cause !== error && isRateLimited(e.cause));
}
export const retryDelay = (attempt: number, error: unknown) => Math.min((isRateLimited(error) ? 60000 : 1000) * 2 ** attempt, 240000);
