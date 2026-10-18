import type { ReactNode } from "react";
export function RecordList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return <dl className="record">{rows.map(({ label, value }, i) => <div key={`${label}-${i}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
