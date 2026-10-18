import { TIRAMISU_PUBLIC_RPC_URL } from "@/lib/arkiv/chain";
import { baseHeaders, CORS_HEADERS, proxyResponseHeaders } from "@/lib/arkiv/proxy/headers";
import { MAX_BODY_BYTES, rpcError, validateRpcBody } from "@/lib/arkiv/proxy/validation";

const fail = (status: number, code: number, message: string) => Response.json(rpcError(code, message), { status, headers: baseHeaders() });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return fail(413, -32600, "Request body too large");
  const reader = request.body?.getReader();
  if (!reader) return fail(400, -32700, "Invalid JSON");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return fail(413, -32600, "Request body too large");
      }
      chunks.push(value);
    }
  } catch {
    return fail(400, -32700, "Invalid request body");
  } finally {
    reader.releaseLock();
  }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return fail(400, -32700, "Invalid JSON"); }
  const error = validateRpcBody(body);
  if (error) return Response.json(error, { status: 400, headers: baseHeaders() });
  const key = process.env.TIRAMISU_API_KEY;
  if (!key) return fail(503, -32000, "Read proxy unavailable");
  try {
    const upstream = await fetch(TIRAMISU_PUBLIC_RPC_URL, {
      method: "POST", headers: { "Content-Type": "application/json", "X-API-KEY": key },
      body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000),
    });
    return new Response(upstream.body, { status: upstream.status, headers: proxyResponseHeaders(upstream.headers) });
  } catch {
    return fail(502, -32000, "Upstream RPC unavailable");
  }
}
