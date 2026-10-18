import { HashChip } from "./hash-chip";
export function EntityChip({ entityKey, full = false, copy = true }: { entityKey: string; full?: boolean; copy?: boolean }) {
  return <HashChip value={entityKey} kind="entity" full={full} copy={copy} />;
}
