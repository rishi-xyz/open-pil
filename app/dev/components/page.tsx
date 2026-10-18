import { Markdown } from "@/components/markdown/markdown";
import { CheckSequence } from "@/components/motion/check-sequence";
import { RegistrySeal } from "@/components/record/registry-seal";
import { AddressChip } from "@/components/record/address-chip";
export default function ComponentsPage() {
  return <main className="wrap gallery"><h1>Petition components</h1><RegistrySeal name="VPHC" role="Court" /><AddressChip address={`0x${"ab".repeat(20)}`} /><Markdown source={"# Synthetic petition\n\nPublic water access.\n\n- Restore supply\n- Publish inspection findings"} /><CheckSequence steps={[{ label: "Petition found", state: "ok" }, { label: "Court registered", state: "ok" }, { label: "Review ownership", state: "waiting" }]} /></main>;
}
