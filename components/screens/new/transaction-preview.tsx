import { AddressChip } from "@/components/record/address-chip";
import { CheckSequence } from "@/components/motion/check-sequence";
import { ExternalLink } from "lucide-react";
import { txUrl } from "@/lib/arkiv/chain";
export function FilingPreview({ title, court, wallet, bytes, due, state, tx }: { title: string; court: string; wallet?: string; bytes: number; due: string; state: "idle" | "signing" | "confirmed" | "error"; tx?: string }) {
  const check = state === "confirmed" ? "ok" : state === "signing" ? "pending" : state === "error" ? "fail" : "waiting";
  const dueLabel = due ? new Date(`${due}T23:59:59`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "not selected";
  return <aside className="panel filing-preview"><div className="panel-head"><h2 className="t-h4">Transaction preview</h2><span className="t-xs">One signature</span></div><div className="panel-body"><p role="status">{state === "signing" ? "Waiting for your wallet and the chain…" : state === "confirmed" ? "Filed and confirmed." : state === "error" ? "Filing failed. Read the error before retrying." : "Review the three operations below."}</p><CheckSequence steps={[
    { label: "Create petition record", detail: `${title || "Title"}, court ${court || "not selected"}, ${(bytes / 1024).toFixed(1)} KB, kept 120 days`, state: check },
    { label: "Create review record", detail: `Due ${dueLabel}, kept until the due date`, state: check },
    { label: "Hand review to the court", detail: "Court wallet", state: check },
  ]} />{wallet && <div className="preview-wallet"><AddressChip address={wallet} /></div>}{tx && <a className="preview-tx" href={txUrl(tx)} target="_blank" rel="noopener noreferrer">View transaction <ExternalLink size={12} /></a>}<p className="t-xs preview-footer">Record keys are computed before you sign.</p></div></aside>;
}
