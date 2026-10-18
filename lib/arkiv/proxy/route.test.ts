import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPTIONS, POST } from "@/app/api/arkiv/route";
import { TIRAMISU_PUBLIC_RPC_URL } from "@/lib/arkiv/chain";

const post = (body: unknown) => new Request("http://localhost/api/arkiv", {
  method: "POST", headers: { "Content-Type": "application/json", "request-source": "https://wallet.keplr.app" }, body: JSON.stringify(body),
});
const call = (method: string, id = 1) => ({ jsonrpc: "2.0", id, method, params: [] });
const expectCors = (response: Response) => {
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
  expect(response.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
  expect(response.headers.get("access-control-allow-headers")).toBe("content-type, request-source");
};

describe("arkiv proxy route", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    vi.stubEnv("TIRAMISU_API_KEY", "secret");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response("[]", { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": "x" } }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); fetchMock.mockReset(); });

  it("answers preflight with CORS headers", () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expectCors(response);
  });
  it("forwards an allowed batch to the public RPC with CORS headers", async () => {
    const body = [call("eth_chainId", 1), call("eth_sendRawTransaction", 2), call("net_version", 3)];
    const response = await POST(post(body));
    expect(response.status).toBe(200);
    expectCors(response);
    expect(response.headers.get("set-cookie")).toBeNull();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TIRAMISU_PUBLIC_RPC_URL);
    expect(JSON.parse(init?.body as string)).toEqual(body);
    expect(new Headers(init?.headers).get("x-api-key")).toBe("secret");
  });
  it("rejects denied methods, oversized batches and bodies with CORS headers", async () => {
    for (const body of [call("eth_sendTransaction"), Array.from({ length: 11 }, (_, i) => call("eth_chainId", i))]) {
      const response = await POST(post(body));
      expect(response.status).toBe(400);
      expectCors(response);
    }
    const large = await POST(post({ ...call("eth_call"), params: ["x".repeat(64 * 1024)] }));
    expect(large.status).toBe(413);
    expectCors(large);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
