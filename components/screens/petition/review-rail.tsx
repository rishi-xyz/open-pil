"use client";
import { useEffect, useState } from "react";
import { AddressChip } from "@/components/record/address-chip";
import { EntityChip } from "@/components/record/entity-chip";
import { RecordList } from "@/components/record/record-list";
import { StatusBadge } from "@/components/record/status-badge";
import { dateLabel, statusLabel, type PetitionState } from "./presentation";
function Digits({ value }: { value: string }) { return <>{[...value].map((digit, index) => <span className="dg" key={index}>{digit}</span>)}</>; }
export function ReviewRail({ state, now: initialNow }: { state: PetitionState; now: number }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) setNow(Date.now()); }, 1000);
    return () => clearInterval(timer);
  }, []);
  const open = state.status === "under-review";
  const remaining = Math.max(0, state.due - now);
  const duration = Math.max(1, state.due - state.filedAt);
  const days = String(Math.floor(remaining / 86400000));
  const hours = String(Math.floor(remaining / 3600000) % 24).padStart(2, "0");
  const minutes = String(Math.floor(remaining / 60000) % 60).padStart(2, "0");
  const seconds = Math.floor(remaining / 1000) % 60;
  const tone = open ? remaining <= 3 * 86400000 ? "soon" : "calm" : state.status;
  const fraction = open ? Math.min(1, remaining / duration) : 1;
  const countdown = <span className="digits"><Digits value={days} /><small>d</small><Digits value={hours} /><small>h</small><Digits value={minutes} /><small>m</small></span>;
  const explanation = state.late ? "Decided after the due date" : state.decision ? "Decided on time" : "Lapsed without a decision";
  return <section className="panel petition-review"><div className="panel-head"><h2 className="t-h4">Review period</h2><StatusBadge tone={state.status === "under-review" ? "review" : state.status === "review-incomplete" ? "incomplete" : state.status}>{open ? "Open" : "Closed"}</StatusBadge></div>
    <div className={`review-summary ${tone}`}><div className="petition-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle className="ring-track" cx="100" cy="100" r="88" /><circle className="ring-progress" cx="100" cy="100" r="88" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - fraction)} /></svg><div className="petition-ring-center" aria-live="off"><strong className={open ? "t-countdown" : "t-h3"}>{open ? <><span className="countdown-full">{countdown}</span><span className="countdown-days"><Digits value={days} /><small>d</small></span></> : statusLabel(state.status)}</strong><span className="countdown-full t-small">{open ? `${seconds} s left` : explanation}</span></div></div><div className="review-text"><div className="countdown-mobile" aria-live="off">{open ? <><strong className="t-countdown">{countdown}</strong><p>{seconds} s left</p></> : <p>{explanation}</p>}</div><p>Due {dateLabel(state.due)}</p></div></div>
    <RecordList rows={[
      { label: "Review entity", value: state.review ? <EntityChip entityKey={state.review.key} /> : "No live review" },
      ...(state.review ? [{ label: "Created by", value: <AddressChip address={state.review.creator} /> }, { label: "Owner", value: <AddressChip address={state.review.owner} /> }] : []),
      { label: "Extensions", value: state.extensions.length },
    ]} /></section>;
}
