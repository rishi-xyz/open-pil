import { HashChip } from "./hash-chip";
export function AddressChip({ address, full = false, copy = true }: { address: string; full?: boolean; copy?: boolean }) {
  return <HashChip value={address} kind="address" full={full} copy={copy} />;
}
