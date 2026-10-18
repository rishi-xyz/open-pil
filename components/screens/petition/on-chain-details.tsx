"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AddressChip } from "@/components/record/address-chip";
import { EntityChip } from "@/components/record/entity-chip";
import { RecordList } from "@/components/record/record-list";
import type { ArkivRecord } from "@/lib/arkiv/records";
import { blockToTime, type BlockTiming } from "@/lib/time";
import { dateLabel, type PetitionState } from "./presentation";
export function OnChainDetails({ state, court, bytes, timing }: { state: PetitionState; court?: ArkivRecord; bytes: number; timing: BlockTiming }) {
  const [open, setOpen] = useState(false);
  const { petition, decision } = state;
  return <div className="onchain" data-open={open}>
    <button type="button" aria-expanded={open} aria-controls="onchain-details" className="panel-head onchain-toggle" onClick={() => setOpen(!open)}>On-chain details<ChevronDown size={16} aria-hidden="true" /></button>
    <div id="onchain-details" hidden={!open}><RecordList rows={[
      { label: "Petition entity", value: <EntityChip entityKey={petition.key} /> },
      { label: "Filed at block", value: <span className="mono">{petition.createdAt}</span> },
      ...(decision ? [{ label: "Decided at block", value: <span className="mono">{decision.createdAt}</span> }] : []),
      ...(court ? [{ label: "Registered by", value: <AddressChip address={court.creator} /> }] : []),
      { label: "Body", value: <><span className="mono">text/markdown</span><small>{bytes.toLocaleString("en-GB")} of 32,768 bytes</small></> },
      { label: "Record ends", value: <>{dateLabel(blockToTime(petition.expiresAt, timing))}<small>Anyone can extend</small></> },
    ]} /></div>
  </div>;
}
