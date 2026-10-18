// Browser CSRF check only. Non browser clients can forge these headers; the rate limit and chain state checks still apply.
export function sameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return site === "same-origin";
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  try { return !!host && new URL(origin).host === host; } catch { return false; }
}
