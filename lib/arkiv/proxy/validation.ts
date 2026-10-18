export const MAX_BODY_BYTES = 64 * 1024;
export const MAX_BATCH_ITEMS = 10;
const allowedMethods = new Set([
  "eth_getBalance", "arkiv_query", "arkiv_getEntityCount", "eth_blockNumber", "eth_chainId",
  "eth_getBlockByNumber", "arkiv_getBlockTiming", "eth_getTransactionReceipt",
  "eth_estimateGas", "eth_gasPrice", "eth_getTransactionCount",
  // Wallet RPC (Privy embedded): signed transactions only; eth_sendTransaction stays denied.
  "eth_sendRawTransaction", "eth_call", "eth_feeHistory", "eth_maxPriorityFeePerGas",
  "eth_getTransactionByHash", "eth_getBlockByHash", "eth_getCode", "net_version",
]);
type RpcId = string | number | null;
export const rpcError = (code: number, message: string, id: RpcId = null) => ({
  jsonrpc: "2.0", id, error: { code, message },
});
function requestId(value: Record<string, unknown>): RpcId {
  return typeof value.id === "string" || (typeof value.id === "number" && Number.isFinite(value.id)) ? value.id : null;
}
function validateRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return rpcError(-32600, "Invalid request");
  const request = value as Record<string, unknown>;
  const id = requestId(request);
  if (request.jsonrpc !== "2.0" || typeof request.method !== "string" ||
    ("id" in request && request.id !== null && id === null) ||
    ("params" in request && (request.params === null || typeof request.params !== "object"))) {
    return rpcError(-32600, "Invalid request", id);
  }
  if (!allowedMethods.has(request.method)) return rpcError(-32601, "Method not allowed", id);
  return null;
}
export function validateRpcBody(value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0 || value.length > MAX_BATCH_ITEMS) return rpcError(-32600, "Invalid request");
    for (const request of value) {
      const error = validateRequest(request);
      if (error) return error;
    }
    return null;
  }
  return validateRequest(value);
}
