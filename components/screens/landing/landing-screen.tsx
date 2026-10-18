import Link from "next/link";
import { FilePlus2, Gavel, Newspaper, Scale, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/record/status-badge";
import { addressUrl, tiramisu } from "@/lib/arkiv/chain";
import "./landing.css";

// Copied verbatim from arkiv/schema.md ("Exact reads"): setup plus the shared snapshot scan.
const SNAPSHOT_QUERY = `import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { eq, or } from "@arkiv-network/sdk/query";
import { http } from "viem";
const client = createPublicClient({ chain: tiramisu, transport: http() });

let page = await client.select("*")
  .where(eq("app", "openpil")).limit(200).fetch();
const entities = [...page.entities];
while (page.hasNextPage()) {
  page = await page.next();
  entities.push(...page.entities);
}
const timing = await client.getBlockTiming();
console.dir({ entities, timing }, { depth: null });`;

const PETITION_QUERY = `await scoped(eq("petition", petitionKey.toLowerCase())).fetch();
await client.getEntity(petitionKey);`;

const users = [
  { icon: Scale, who: "PIL petitioners", need: "Need to show that a petition was filed, by whom and when, and to know the date by which the court should respond." },
  { icon: Users, who: "Legal aid NGOs", need: "File and follow petitions on behalf of communities and need a record of each one that does not depend on a single office keeping it." },
  { icon: Newspaper, who: "Journalists and civic watchers", need: "Track which petitions are still pending, which were decided, and which passed their deadline with no decision." },
];

const changes = [
  { title: "Proof of filing", body: "Each petition records its filing wallet as on chain creator metadata. The petition page shows it next to the court and filing date." },
  { title: "A deadline you can see", body: "The review period is a separate record that expires at the due date. The petition page counts down to it and names the court that holds it." },
  { title: "A decision anyone can check", body: "Accept or reject reasons are stored as records created by the registered court wallet. The Verification panel checks that creator against the registry." },
  { title: "No silent disappearance", body: "When the due date passes without a decision, the petition is shown as Expired, in public, rather than quietly dropping off a list." },
];

const comparison = [
  { need: "Who filed and who decided", db: "Whatever the operator's table says", ipfs: "Content is addressed by hash; no signer is recorded", own: "Possible, if you deploy a contract and someone runs the indexer", arkiv: "$creator is set from the signing wallet and cannot be changed" },
  { need: "Court holds the review", db: "A role column the operator can edit", ipfs: "No ownership of a file", own: "Custom contract logic", arkiv: "Ownership transfer to the court wallet, in the filing transaction" },
  { need: "Deadline enforced by the data", db: "A cron job on the operator's server", ipfs: "No expiry tied to a deadline", own: "Custom contract logic and indexer", arkiv: "The review record expires at its due date" },
  { need: "Decision closes the review", db: "Two writes the operator promises to do together", ipfs: "Not applicable", own: "Custom contract logic", arkiv: "One batch creates the decision and deletes the live review" },
  { need: "Anyone can re-read it", db: "Only through the operator's API", ipfs: "Content, yes. Typed queries, no", own: "Through whoever hosts the subgraph or API", arkiv: "Typed queries on the public Tiramisu RPC" },
];

const features = [
  { feature: "Typed attributes and a markdown payload", see: "Court, title and status filters on Petitions, and the rendered petition body and decision reason.", detail: "title and court are str, filedat and duedate are u64; the body is text/markdown up to 32 KB.", paths: ["lib/arkiv/model.ts", "lib/arkiv/writes/markdown.ts"] },
  { feature: "Atomic executeBatch filing with predicted keys", see: "New petition submits once and opens both the petition and its review period.", detail: "predictEntityKeys reserves two keys; one batch creates petition and review and transfers the review to the court. Returned keys are compared with the prediction.", paths: ["lib/arkiv/writes/file-petition.ts"] },
  { feature: "Expiration as the review deadline", see: "The Review period ring counts down to the due date and the status becomes Expired if it passes.", detail: "The review is created with ExpirationTime.atDate(duedate). Status is derived from chain block time.", paths: ["lib/arkiv/writes/file-petition.ts", "lib/arkiv/trust/revision3.ts"] },
  { feature: "Extension batch", see: "The Due date moves and the petition shows how many times the court extended it.", detail: "One batch creates the reason record, patches review duedate and extensions, and extends the review expiry.", paths: ["lib/arkiv/writes/extend-review.ts"] },
  { feature: "Decision batch", see: "Accepted or Rejected with the court's reason; the review period closes.", detail: "One batch creates the decision and deletes the court owned review when it is still live.", paths: ["lib/arkiv/writes/decide.ts"] },
  { feature: "permissionlessExtension and Keep alive", see: "Any signed in user with test GLM can keep a petition or decision public for 30 more days.", detail: "extendEntity to the current expiry plus 30 × 43200 blocks. Petitions, decisions, extensions and court records are created with permissionlessExtension.", paths: ["lib/arkiv/writes/keep-alive.ts", "lib/arkiv/writes/markdown.ts", "lib/arkiv/writes/entity.ts"] },
  { feature: "$creator versus $owner", see: "The Review period lists the petitioner as creator and the court as owner; a seal marks registered courts.", detail: "A court counts only if its org record was created by the configured registry wallet. Write preflight queries courts with createdBy(registry).", paths: ["lib/arkiv/trust/revision3.ts", "lib/arkiv/queries/petitions.ts"] },
  { feature: "watchEntityEvents over WebSocket", see: "Live activity on Petitions refreshes the list when known wallets write.", detail: "Subscribes without fromBlock. Events carry no attributes, so they only trigger a fresh read.", paths: ["components/screens/petitions/live-feed.tsx", "lib/arkiv/clients.ts"] },
  { feature: "Cursor pagination", see: "Counts and status buckets cover every record, not only the first page.", detail: "The shared snapshot follows page.next() until hasNextPage() is false; write preflight follows cursors for courts and related records.", paths: ["hooks/use-openpil-snapshot.ts", "lib/arkiv/writes/review-context.ts"] },
];

const offChain = ["Real names and identities of petitioners", "Sensitive documents and evidence", "Credentials and private keys", "Payments"];

export function LandingScreen() {
  const registry = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  const explorer = tiramisu.blockExplorers.default.url;
  return <div className="landing">
    <section className="ld-band ld-hero" data-band="base" aria-labelledby="ld-hero-title">
      <div className="ld-hero-copy">
        <p className="t-eyebrow">Public interest litigation on Arkiv</p>
        <h1 id="ld-hero-title" className="ld-title">A petition, its deadline and the court&apos;s answer, on a public record.</h1>
        <p className="ld-lede">OpenPIL records who filed a petition, which registered court holds its review, and whether the court decided before the due date. Anyone can read the same records from the public Tiramisu RPC, without this website.</p>
        <div className="ld-actions">
          <Link href="/petitions" className={buttonVariants({ size: "lg" })}>Browse petitions</Link>
          <Link href="/new" className={buttonVariants({ size: "lg", variant: "outline" })}><FilePlus2 aria-hidden="true" />File a petition</Link>
          <Link href="/court" className={buttonVariants({ size: "lg", variant: "ghost" })}><Gavel aria-hidden="true" />Try the demo court</Link>
        </div>
        <p className="ld-caveat t-small">A demonstration on the Tiramisu testnet. Petitions are synthetic and go to the fictional High Court of Vindhya Pradesh (VPHC). This is not an official filing service.</p>
      </div>
      <HeroArt />
    </section>

    <section className="ld-band ld-section" data-band="surface" aria-labelledby="ld-india">
      <header className="ld-head"><p className="t-eyebrow">The problem</p><h2 id="ld-india" className="t-h1">Why India</h2><p>Public Interest Litigation gives civic concerns a route to court. A missing filing record or an unverifiable claim of a decision makes public scrutiny harder for everyone following a case.</p></header>
      <div className="ld-india">
        <ul className="ld-users">{users.map(({ icon: Icon, who, need }) => <li key={who}><span className="ld-user-icon"><Icon size={20} aria-hidden="true" /></span><div><h3 className="t-h3">{who}</h3><p>{need}</p></div></li>)}</ul>
        <div className="ld-changes"><h3 className="t-h3">What OpenPIL demonstrates for them</h3><dl>{changes.map(c => <div key={c.title}><dt>{c.title}</dt><dd>{c.body}</dd></div>)}</dl></div>
      </div>
      <p className="ld-note t-small">Every petition in this demo is synthetic and every decision comes from a demonstration court. OpenPIL shows how such a record could work; it is not connected to any real court, and a record here has no legal effect.</p>
    </section>

    <section className="ld-band ld-section" data-band="base" aria-labelledby="ld-how">
      <header className="ld-head"><p className="t-eyebrow">Lifecycle</p><h2 id="ld-how" className="t-h1">How it works</h2><p>A petition and its review are two records with different lifetimes. The review is a lease the court holds until the due date.</p></header>
      <div className="ld-filing"><div className="ld-filing-copy"><h3 className="t-h2">One transaction to file</h3><p>Filing creates two records at once. The petition carries typed attributes and a markdown body. The review carries the due date as its expiry and is handed to the court in the same transaction, so the petitioner stays its creator while the court becomes its owner.</p></div><FilingDiagram /></div>
      <LifecycleDiagram />
      <ol className="ld-steps">
        <li><span className="ld-step-n">1</span><h3 className="t-h3">File</h3><p>The petitioner signs one transaction that creates the petition and its review, and hands the review to the registered court.</p></li>
        <li><span className="ld-step-n">2</span><h3 className="t-h3">Under review</h3><p>The review record expires at the due date. While it lives, the petition shows Under review with a countdown.</p></li>
        <li><span className="ld-step-n">3</span><h3 className="t-h3">Extend</h3><p>Before the deadline, the court can record a reason and push the due date later. The review&apos;s expiry moves with it.</p></li>
        <li><span className="ld-step-n">4</span><h3 className="t-h3">Decide or expire</h3><p>A decision is recorded and the review deleted in one transaction. With no decision by the due date, the status is Expired.</p></li>
      </ol>
    </section>

    <section className="ld-band ld-section" data-band="tint" aria-labelledby="ld-arkiv">
      <header className="ld-head"><p className="t-eyebrow">Trust model</p><h2 id="ld-arkiv" className="t-h1">Why Arkiv</h2><p>The point is that readers should not have to trust whoever runs the website. Here is what each alternative would leave to trust.</p></header>
      <div className="ld-table-scroll" tabIndex={0} aria-label="Comparison of storage options, scrolls sideways on small screens">
        <table className="ld-compare">
          <thead><tr><th scope="col">What the record must prove</th><th scope="col">Operator database</th><th scope="col">IPFS</th><th scope="col">Own contract with a subgraph or API</th><th scope="col" className="ld-arkiv-col">Arkiv</th></tr></thead>
          <tbody>{comparison.map(row => <tr key={row.need}><th scope="row">{row.need}</th><td>{row.db}</td><td>{row.ipfs}</td><td>{row.own}</td><td className="ld-arkiv-col">{row.arkiv}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="ld-split">
        <div className="card card-pad"><h3 className="t-h3">What stays off Arkiv</h3><p className="ld-muted">Attributes and payloads are public. OpenPIL keeps these out of every record:</p><ul className="ld-off">{offChain.map(item => <li key={item}>{item}</li>)}</ul><p className="ld-muted t-small">Expiry removes a record from queries but does not erase transaction data or copies others made.</p></div>
        <div className="card card-pad"><h3 className="t-h3">Reproducible without OpenPIL</h3><p className="ld-muted">The app reads through its own keyed proxy at <code className="mono">/api/arkiv</code>. The same query works directly against <code className="mono">rpc.tiramisu.db-chain.testnet.arkiv.network</code> with no login and no OpenPIL server. Anonymous rate limits still apply.</p></div>
      </div>
    </section>

    <section className="ld-band ld-section" data-band="surface" aria-labelledby="ld-features">
      <header className="ld-head"><p className="t-eyebrow">In the code</p><h2 id="ld-features" className="t-h1">How OpenPIL uses Arkiv</h2><p>Each Arkiv feature and the place you see it in the app. Paths are relative to the repository root.</p></header>
      <EntityMap />
      <ul className="ld-features">{features.map(f => <li key={f.feature}><h3 className="t-h3">{f.feature}</h3><p className="ld-see">{f.see}</p><p className="ld-muted t-small">{f.detail}</p><p className="ld-paths">{f.paths.map(p => <code key={p} className="mono">{p}</code>)}</p></li>)}</ul>
    </section>

    <section className="ld-band ld-section" data-band="base" aria-labelledby="ld-verify">
      <header className="ld-head"><p className="t-eyebrow">Transparency</p><h2 id="ld-verify" className="t-h1">Verify it yourself</h2><p>Run this with <code className="mono">node --input-type=module</code> from the installed repository. It is the same whole application scan the app&apos;s screens are derived from.</p></header>
      <div className="ld-verify">
        <figure className="panel ld-code"><figcaption className="panel-head"><span className="t-h4">Whole application snapshot</span><span className="t-xs ld-muted">from arkiv/schema.md</span></figcaption><pre><code>{SNAPSHOT_QUERY}</code></pre><figcaption className="ld-code-sub t-small">For one petition, with the <code className="mono">scoped</code> helper from the same file:</figcaption><pre><code>{PETITION_QUERY}</code></pre></figure>
        <div className="ld-facts">
          <dl className="card card-pad">
            <div><dt>Network</dt><dd>Arkiv Tiramisu testnet, chain ID <span className="mono">{tiramisu.id}</span></dd></div>
            <div><dt>Explorer</dt><dd><a href={explorer} target="_blank" rel="noopener noreferrer">{explorer.replace("https://", "")}</a></dd></div>
            {registry && <div><dt>Registry wallet</dt><dd><a className="mono ld-addr" href={addressUrl(registry)} target="_blank" rel="noopener noreferrer">{registry}</a></dd></div>}
            <div><dt>Data contract</dt><dd><code className="mono">arkiv/schema.md</code> lists every entity type, stored attribute type, expiration and exact query.</dd></div>
            <div><dt>Known friction</dt><dd><code className="mono">arkiv/friction.md</code> records SDK and RPC issues met while building, such as typed equality and rate limits.</dd></div>
          </dl>
          <div className="ld-demo-court"><StatusBadge tone="incomplete">Demo court</StatusBadge><p>The <Link href="/court">court page</Link> lets anyone accept, reject or extend a review so judges can try the full cycle. The server signs those writes with the demo court key, so every demo decision is created by the registered court wallet regardless of who clicked. In a real deployment only the registered court&apos;s own wallet would sign.</p></div>
        </div>
      </div>
    </section>

    <section className="ld-band ld-end" data-band="brand" aria-label="Start">
      <div className="ld-end-inner"><div><p className="t-eyebrow">Try it</p><h2 className="t-h1">See the record for yourself.</h2><p>Browse the synthetic petitions, file one with a test wallet, or act as the demo court.</p></div>
      <div className="ld-actions"><Link href="/petitions" className={buttonVariants({ size: "lg", variant: "outline", className: "ld-on-brand" })}>Browse petitions</Link><Link href="/new" className={buttonVariants({ size: "lg", variant: "ghost", className: "ld-on-brand-ghost" })}>File a petition</Link><Link href="/court" className={buttonVariants({ size: "lg", variant: "ghost", className: "ld-on-brand-ghost" })}>Try the demo court</Link></div></div>
    </section>
  </div>;
}

// Decorative hero composition: a chain of record blocks and a seal ring. Carries no information.
function HeroArt() {
  const blocks = [[60, 250, "a"], [150, 200, "b"], [240, 150, "a"], [330, 100, "c"], [150, 300, "b"], [240, 250, "a"], [330, 200, "b"], [420, 150, "a"]] as const;
  return <div className="ld-art" aria-hidden="true">
    <svg viewBox="0 0 520 440" focusable="false">
      <defs>
        <radialGradient id="ld-art-glow" cx="50%" cy="45%" r="55%"><stop offset="0" stopColor="var(--teal-wash-strong)" /><stop offset="1" stopColor="var(--teal-wash)" stopOpacity="0" /></radialGradient>
        <linearGradient id="ld-art-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0E7A8F" /><stop offset="1" stopColor="var(--teal-active)" /></linearGradient>
        <linearGradient id="ld-art-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--surface-1)" /><stop offset="1" stopColor="var(--teal-wash-strong)" /></linearGradient>
        <linearGradient id="ld-art-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C8417F" /><stop offset="1" stopColor="var(--rani)" /></linearGradient>
        <pattern id="ld-art-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="var(--border-strong)" /></pattern>
      </defs>
      <rect x="0" y="0" width="520" height="440" fill="url(#ld-art-dots)" opacity=".6" />
      <circle cx="260" cy="210" r="210" fill="url(#ld-art-glow)" />
      <g className="ld-art-links">{blocks.slice(0, 4).map(([x, y], i) => i < 3 && <path key={i} d={`M${x + 40} ${y + 40}L${blocks[i + 1][0] + 40} ${blocks[i + 1][1] + 40}`} />)}{blocks.slice(4).map(([x, y], i) => i < 3 && <path key={`b${i}`} d={`M${x + 40} ${y + 40}L${blocks[i + 5][0] + 40} ${blocks[i + 5][1] + 40}`} />)}{blocks.slice(0, 4).map(([x, y], i) => <path key={`v${i}`} d={`M${x + 40} ${y + 40}L${blocks[i + 4][0] + 40} ${blocks[i + 4][1] + 40}`} />)}</g>
      {blocks.map(([x, y, tone], i) => <g key={i} className="ld-art-block" style={{ animationDelay: `${i * 0.12}s` }}><rect x={x + 4} y={y + 8} width="72" height="72" rx="16" fill="rgb(19 35 42 / .08)" /><rect x={x} y={y} width="72" height="72" rx="16" fill={`url(#ld-art-${tone})`} stroke={tone === "b" ? "var(--border)" : "none"} /><rect x={x + 16} y={y + 18} width={tone === "b" ? 28 : 36} height="6" rx="3" fill={tone === "b" ? "var(--teal)" : "#fff"} opacity=".55" /><rect x={x + 16} y={y + 32} width="24" height="6" rx="3" fill={tone === "b" ? "var(--teal)" : "#fff"} opacity=".3" /></g>)}
      <g className="ld-art-seal" transform="translate(400 330)"><circle r="74" fill="var(--seal-bg)" opacity=".9" /><circle className="ld-art-ring" r="62" fill="none" stroke="var(--seal)" strokeWidth="2" strokeDasharray="3 7" /><circle r="48" fill="none" stroke="var(--seal)" strokeWidth="3" /><circle r="30" fill="none" stroke="var(--seal-border)" strokeWidth="8" /><circle r="9" fill="var(--seal)" /></g>
      <circle cx="96" cy="96" r="28" fill="none" stroke="var(--teal)" strokeWidth="2" opacity=".35" />
      <circle cx="96" cy="96" r="6" fill="var(--rani)" opacity=".7" />
    </svg>
  </div>;
}

// The filing transaction and the two entities it creates.
function FilingDiagram() {
  return <figure className="ld-tx" aria-label="One filing transaction creates a petition and a review, and transfers the review to the court">
    <figcaption className="ld-tx-head"><span className="mono">executeBatch</span><span className="t-xs">2 creates, 1 ownership change, one transaction</span></figcaption>
    <div className="ld-tx-body">
      <EntityCard type="petition" rows={[["title", "str"], ["court", "str", "VPHC"], ["filedat", "u64"], ["duedate", "u64"]]} payload="text/markdown" expires="120 days" creator="petitioner" owner="petitioner" />
      <svg className="ld-tx-link" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 20h28m-8-8 8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      <EntityCard type="review" rows={[["petition", "str", "key"], ["court", "str", "wallet"], ["duedate", "u64"], ["extensions", "i32", "0"]]} payload="application/json" expires="at duedate" creator="petitioner" owner="court" transferred />
    </div>
    <div className="ld-tx-lease" aria-hidden="true"><span className="t-xs">Review lease</span><div className="ld-lease-bar"><i /></div><div className="ld-lease-ends t-xs"><span>Filed</span><span>Due date: record expires</span></div></div>
  </figure>;
}

function EntityCard({ type, rows, payload, expires, creator, owner, transferred }: { type: string; rows: string[][]; payload: string; expires: string; creator: string; owner: string; transferred?: boolean }) {
  return <div className="ld-entity">
    <p className="ld-entity-type mono">{type}</p>
    <dl className="ld-attrs">{rows.map(([name, kind, value]) => <div key={name}><dt className="mono">{name}</dt><dd><span className="ld-kind mono">{kind}</span>{value && <span className="ld-val">{value}</span>}</dd></div>)}</dl>
    <dl className="ld-meta">
      <div><dt>payload</dt><dd className="mono">{payload}</dd></div>
      <div><dt>expires</dt><dd>{expires}</dd></div>
      <div><dt className="mono">$creator</dt><dd>{creator}</dd></div>
      <div data-transferred={transferred || undefined}><dt className="mono">$owner</dt><dd>{owner}{transferred && <span className="ld-transfer"> transferred</span>}</dd></div>
    </dl>
  </div>;
}

// Lane chart of record lifetimes. Scrolls sideways inside its frame on narrow screens.
function LifecycleDiagram() {
  return <div className="ld-lanes-scroll" tabIndex={0} role="region" aria-label="Lifecycle chart, scrolls sideways on small screens">
    <svg className="ld-lanes" viewBox="0 32 960 268" role="img" aria-labelledby="ld-lanes-title ld-lanes-desc">
      <title id="ld-lanes-title">Record lifetimes</title>
      <desc id="ld-lanes-desc">The petition lives 120 days and Keep alive adds 30 days. The review lives from filing to the due date. An extension moves the due date later. A decision deletes the review; with no decision the review lapses and the petition is Expired.</desc>
      <g className="lane-labels">
        <text x="0" y="64">petition</text>
        <text x="0" y="144">review</text>
        <text x="0" y="224">court records</text>
      </g>
      <line className="lane-axis" x1="140" y1="260" x2="940" y2="260" />
      <rect className="bar-petition" x="140" y="48" width="660" height="24" rx="6" />
      <text className="bar-text-light" x="156" y="65">created with the review, expires after 120 days</text>
      <rect className="bar-keep" x="800" y="48" width="140" height="24" rx="6" />
      <text className="bar-text" x="812" y="65">Keep alive, +30 days</text>
      <rect className="bar-review" x="140" y="128" width="300" height="24" rx="6" />
      <text className="bar-text-light" x="156" y="145">lease owned by the court</text>
      <rect className="bar-extended" x="440" y="128" width="100" height="24" rx="0" />
      <rect className="bar-ghost" x="540" y="128" width="80" height="24" rx="6" />
      <line className="mark-due" x1="440" y1="112" x2="440" y2="260" />
      <line className="mark-due" x1="620" y1="112" x2="620" y2="260" />
      <circle className="dot-ext" cx="400" cy="216" r="8" />
      <text className="dot-text" x="414" y="221">extension</text>
      <path className="link" d="M400 208 V160" />
      <circle className="dot-dec" cx="540" cy="216" r="8" />
      <text className="dot-text" x="554" y="221">decision</text>
      <path className="link" d="M540 208 V160" />
      <text className="note" x="548" y="118">or lapses at the new due date: Expired</text>
      <text className="axis-text" x="140" y="284">filed</text>
      <text className="axis-text" x="440" y="284" textAnchor="middle">due date</text>
      <text className="axis-text" x="620" y="284" textAnchor="middle">extended due date</text>
      <text className="axis-text" x="940" y="284" textAnchor="end">time in blocks</text>
    </svg>
  </div>;
}

// Entity model: five record types, linked by a petition key stored as str.
function EntityMap() {
  return <div className="ld-map" aria-label="Entity model">
    <div className="ld-map-node" data-kind="org"><span className="mono">org</span><small>created by the registry; names a court wallet and code</small></div>
    <div className="ld-map-node" data-kind="petition"><span className="mono">petition</span><small>created by the petitioner</small></div>
    <div className="ld-map-refs">
      <div className="ld-map-node" data-kind="review"><span className="mono">review</span><small>owned by the court</small></div>
      <div className="ld-map-node" data-kind="extension"><span className="mono">extension</span><small>created by the court</small></div>
      <div className="ld-map-node" data-kind="decision"><span className="mono">decision</span><small>created by the court</small></div>
    </div>
    <p className="ld-map-caption t-small">Every record has <code className="mono">app = &quot;openpil&quot;</code> and a <code className="mono">type</code>. Review, extension and decision point at their petition through a <code className="mono">petition</code> attribute stored as <code className="mono">str</code>. Court trust comes from the registry&apos;s <code className="mono">org</code> records.</p>
  </div>;
}
