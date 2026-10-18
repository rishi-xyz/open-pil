export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, request-source",
  "Access-Control-Max-Age": "86400",
} as const;
export const baseHeaders = () => new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS });
export function proxyResponseHeaders(upstream: Headers) {
  const headers = baseHeaders();
  upstream.forEach((value, name) => {
    if (name === "retry-after" || /^ratelimit(?:-|$)/i.test(name) || /^x-ratelimit(?:-|$)/i.test(name)) headers.set(name, value);
  });
  return headers;
}
