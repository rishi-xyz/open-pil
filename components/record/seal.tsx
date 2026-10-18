"use client";
import { useId } from "react";
export type SealTone = "verified" | "warn" | "missed" | "seal";
export function Seal({ tone, rim, center, secondLine, sub, size = 120, animate = false }: { tone: SealTone; rim: string; center: string; secondLine?: string; sub?: string; size?: number; animate?: boolean }) {
  const id = useId().replace(/:/g, "");
  const color = tone === "seal" ? "var(--seal)" : `var(--stamp-${tone})`;
  return <svg className={`seal${animate ? " stamp-in" : ""}`} viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={[center, secondLine, sub].filter(Boolean).join(" ")} style={{ color, transform: "rotate(-6deg)" }}>
    <defs><path id={`${id}-rim`} d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" /><filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.5" result="mask" /><feComposite in="SourceGraphic" in2="mask" operator="in" result="speckled" /><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="3" result="w" /><feDisplacementMap in="speckled" in2="w" scale="1.6" /></filter></defs>
    <g fill="currentColor" filter={tone === "seal" ? undefined : `url(#${id}-ink)`}>{[56, 51, 35].map((r, i) => <circle key={r} cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth={i === 0 ? 3 : 1} />)}<text fontSize="8.2" fontWeight="500"><textPath href={`#${id}-rim`} textLength="258" lengthAdjust="spacing">{rim.replaceAll("*", "✦")}</textPath></text><text className="c-title" x="60" y={secondLine ? 58 : sub ? 63 : 66} textAnchor="middle" fontSize="14" textLength={center.length > 5 ? 58 : undefined} lengthAdjust="spacingAndGlyphs">{center}</text>{secondLine ? <text className="c-title" x="60" y="74" textAnchor="middle" fontSize="13" textLength="58" lengthAdjust="spacingAndGlyphs">{secondLine}</text> : sub && <><line x1="38" y1="70" x2="82" y2="70" stroke="currentColor" strokeWidth=".8" /><text x="60" y="81" textAnchor="middle" fontSize="7" fontWeight="600">{sub}</text></>}</g>
  </svg>;
}
