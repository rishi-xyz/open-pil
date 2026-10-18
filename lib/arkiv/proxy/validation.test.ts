import { describe, expect, it } from "vitest";
import { validateRpcBody } from "./validation";

const request = (method: string) => ({ jsonrpc: "2.0", id: 7, method, params: [] });
describe("read proxy validation", () => {
  it.each(["eth_getBalance", "arkiv_query", "arkiv_getEntityCount", "eth_blockNumber", "eth_chainId", "eth_getBlockByNumber", "arkiv_getBlockTiming", "eth_getTransactionReceipt", "eth_estimateGas", "eth_gasPrice", "eth_getTransactionCount", "eth_sendRawTransaction", "eth_call", "eth_feeHistory", "eth_maxPriorityFeePerGas", "eth_getTransactionByHash", "eth_getBlockByHash", "eth_getCode", "net_version"])("allows %s", method => {
    expect(validateRpcBody(request(method))).toBeNull();
  });
  it.each(["eth_sendTransaction", "eth_sign", "personal_sign", "eth_accounts", "arkiv_execute", "eth_getLogs", "toString", "ETH_chainId"])("denies %s", method => {
    expect(validateRpcBody(request(method))).toEqual({ jsonrpc: "2.0", id: 7, error: { code: -32601, message: "Method not allowed" } });
  });
  it("validates the entire batch before forwarding", () => {
    expect(validateRpcBody([request("eth_chainId"), request("eth_blockNumber")])).toBeNull();
    expect(validateRpcBody([request("eth_chainId"), request("eth_sendTransaction")])?.error.code).toBe(-32601);
    expect(validateRpcBody([request("eth_chainId"), null])?.error.code).toBe(-32600);
    expect(validateRpcBody([[request("eth_chainId")]])?.error.code).toBe(-32600);
  });
  it("caps batches at ten requests", () => {
    expect(validateRpcBody(Array.from({ length: 10 }, () => request("eth_chainId")))).toBeNull();
    expect(validateRpcBody(Array.from({ length: 11 }, () => request("eth_chainId")))).toEqual({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } });
  });
  it.each([null, true, 1, "rpc", [], {}, { method: "eth_chainId" }, { ...request("eth_chainId"), params: "bad" }, { ...request("eth_chainId"), params: null }, { ...request("eth_chainId"), id: {} }])("rejects malformed envelopes: %j", value => {
    expect(validateRpcBody(value)?.error.code).toBe(-32600);
  });
  it("preserves valid ids and supports notifications and named parameters", () => {
    expect(validateRpcBody({ jsonrpc: "2.0", method: "eth_chainId" })).toBeNull();
    expect(validateRpcBody({ ...request("arkiv_query"), params: { query: 'app = "openpil"' } })).toBeNull();
    expect(validateRpcBody({ ...request("denied"), id: "abc" })?.id).toBe("abc");
  });
});
