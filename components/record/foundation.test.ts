import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckSequence } from "../motion/check-sequence";
import { Markdown } from "../markdown/markdown";
import { StatusBadge } from "./status-badge";
describe("foundation rendering", () => {
  it("renders resolved check icons on the first paint without an animation clock", () => {
    const html = renderToStaticMarkup(createElement(CheckSequence, { steps: [{ label: "Court registered", state: "ok" }, { label: "Ownership checked", state: "fail" }, { label: "No extension", state: "skipped" }] }));
    expect(html.match(/<svg/g)).toHaveLength(3);
    expect(html).toContain("Not applicable");
    expect(html).not.toContain("motion-paused");
    expect(html).not.toContain("stroke-dasharray");
  });
  it("keeps tables in a scrollable wrapper and does not render raw HTML", () => {
    const html = renderToStaticMarkup(createElement(Markdown, { source: "| Month | Finding |\n| --- | --- |\n| September | Bhatgaon |\n\n<script>alert(1)</script>" }));
    expect(html).toContain('<div class="markdown-table"><table>');
    expect(html).toContain("September");
    expect(html).not.toContain("<script>");
  });
  it("renders the review indicator and accessible plain status text", () => {
    const html = renderToStaticMarkup(createElement(StatusBadge, { tone: "review" }, "Under review"));
    expect(html).toContain('class="review-dot" aria-hidden="true"');
    expect(html).toContain("Under review");
    expect(renderToStaticMarkup(createElement(StatusBadge, { tone: "late" }))).toContain("Decided late");
  });
});
