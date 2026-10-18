import { Markdown } from "@/components/markdown/markdown";
import { AddressChip } from "@/components/record/address-chip";
import { EntityChip } from "@/components/record/entity-chip";
import { TimelineItem } from "@/components/record/timeline-item";
import { blockToTime, type BlockTiming } from "@/lib/time";
import { dateLabel, type PetitionState } from "./presentation";
export function PetitionTimeline({ state, timing }: { state: PetitionState; timing: BlockTiming }) {
  const when = (record: PetitionState["petition"]) => <>{dateLabel(blockToTime(record.createdAt, timing))} <span className="mono">Block {record.createdAt}</span></>;
  return <section className="card card-pad petition-timeline"><h2 className="t-h2">Record</h2><p className="t-small">Read from Arkiv, oldest first</p><ol>
    <TimelineItem title="Petition filed" when={when(state.petition)}><p>Written by <AddressChip address={state.petition.creator} /></p><EntityChip entityKey={state.petition.key} /></TimelineItem>
    {state.review && <TimelineItem title="Review opened" when={when(state.review)}><p>Created by <AddressChip address={state.review.creator} /> owned by <AddressChip address={state.review.owner} /></p><EntityChip entityKey={state.review.key} /></TimelineItem>}
    {state.extensions.map(record => <TimelineItem key={record.key} variant="adjourn" title={`Review extended to ${dateLabel(Number(record.attributes.newdue))}`} when={when(record)}><Markdown source={typeof record.payload === "string" ? record.payload : ""} className="small" /><EntityChip entityKey={record.key} /></TimelineItem>)}
    {state.decision ? <TimelineItem variant={state.late ? "late" : state.status === "accepted" ? "answered" : "missed"} title={`${state.status === "accepted" ? "Accepted" : "Rejected"} by the court${state.late ? ", decided late" : ""}`} when={when(state.decision)}><p>Signed by <AddressChip address={state.decision.creator} />. Reason recorded above.</p><EntityChip entityKey={state.decision.key} /></TimelineItem> : <TimelineItem variant={state.status === "expired" ? "late" : "open"} title={state.status === "expired" ? "Review lapsed without a decision" : state.status === "review-incomplete" ? "Review lease incomplete" : "Awaiting the court’s decision"} when={dateLabel(state.due)}><p>{state.status === "expired" ? "No valid court decision was recorded before the due date." : "The effective due date includes accepted court extensions."}</p></TimelineItem>}
  </ol></section>;
}
