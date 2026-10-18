import Link from "next/link";
import { Gavel } from "lucide-react";
import { StatusBadge } from "@/components/record/status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { PetitionState } from "./presentation";
// Court writes moved to the public demo court; this panel only points there while the review is open.
export function CourtLink({ state, courtName }: { state: PetitionState; courtName: string }) {
  if (state.status !== "under-review") return null;
  return <section className="panel petition-court"><div className="panel-head"><StatusBadge tone="seal">Court</StatusBadge><h2 className="t-h4">Court actions</h2></div><div className="panel-body"><p className="t-small">This petition awaits the {courtName}. The demo court is public: anyone can accept, reject or extend the review, and the server signs with the court key.</p><Link href="/court" className={buttonVariants({ variant: "outline" })}><Gavel size={16} aria-hidden="true" />Open court</Link></div></section>;
}
