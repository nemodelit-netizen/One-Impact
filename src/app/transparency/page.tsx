import Link from "next/link";
import { db } from "@/lib/db";
import { LEDGER_TYPES, stageLabel, type LedgerType } from "@/lib/constants";
import { formatMoney, getFinancialSummary } from "@/lib/finance";
import { verifyChain } from "@/lib/ledger";
import { Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function TransparencyPage() {
  const [fin, entries, projects] = await Promise.all([
    getFinancialSummary(),
    db.ledgerEntry.findMany({ orderBy: { seq: "asc" } }),
    db.project.findMany({ where: { ledger: { some: {} } }, include: { ledger: true } }),
  ]);
  const chain = verifyChain(entries);
  // Individual contributions are aggregated so members stay anonymous.
  const recent = entries.filter((e) => e.type !== "CONTRIBUTION").reverse().slice(0, 15);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Where the money goes</h1>
        <p className="mt-2 text-muted max-w-2xl">Every contribution, allocation, disbursement and cost is recorded in an append-only ledger. These numbers are computed live from that ledger.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Contributed" value={formatMoney(fin.contributions - fin.refunds)} hint={fin.refunds ? `after ${formatMoney(fin.refunds)} refunded` : undefined} />
        <Stat label="Disbursed to projects" value={formatMoney(fin.disbursed)} />
        <Stat label="Authorized, not yet paid" value={formatMoney(fin.reserve)} hint="held for funded projects" />
        <Stat label="Available for next round" value={formatMoney(fin.unallocated)} />
        <Stat label="Operating costs" value={formatMoney(fin.operating)} hint={`${(fin.operatingRatio * 100).toFixed(1)}% of contributions`} />
        <Stat label="Ledger entries" value={entries.length.toLocaleString()} />
      </section>

      <section className={`rounded-lg border p-4 text-sm ${chain.ok ? "border-brand/30 bg-brand-soft" : "border-red-200 bg-red-50 text-red-800"}`}>
        {chain.ok ? (
          <>
            <strong>Ledger integrity check passed.</strong> All {chain.checked} entries were re-hashed just now and each one links to the one before. Head hash <code className="break-all text-xs">{chain.head}</code>
          </>
        ) : (
          <><strong>Ledger integrity check failed</strong> at entry #{chain.brokenAt}. History may have been altered.</>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">By project</h2>
        <table className="w-full text-sm rounded-lg border border-line bg-card">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Project</th><th className="p-3">Stage</th><th className="p-3 text-right">Authorized</th><th className="p-3 text-right">Disbursed</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {projects.map((p) => {
              const sum = (t: string) => p.ledger.filter((e) => e.type === t).reduce((a, e) => a + e.amountCents, 0);
              return (
                <tr key={p.id}>
                  <td className="p-3"><Link href={`/projects/${p.slug}`} className="hover:underline">{p.title}</Link></td>
                  <td className="p-3 text-muted">{stageLabel(p.stage)}</td>
                  <td className="p-3 text-right tabular-nums">{formatMoney(sum("ALLOCATION"))}</td>
                  <td className="p-3 text-right tabular-nums">{formatMoney(sum("DISBURSEMENT"))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Recent outflows and decisions</h2>
        <table className="w-full text-sm rounded-lg border border-line bg-card">
          <tbody className="divide-y divide-line">
            {recent.map((e) => (
              <tr key={e.seq}>
                <td className="p-3 text-muted tabular-nums">#{e.seq}</td>
                <td className="p-3 text-muted">{fmtDate(e.createdAt)}</td>
                <td className="p-3">{LEDGER_TYPES[e.type as LedgerType]}<div className="text-xs text-muted">{e.memo}</div></td>
                <td className="p-3 text-right tabular-nums">{formatMoney(e.amountCents)}</td>
                <td className="p-3 hidden md:table-cell"><code className="text-xs text-muted">{e.hash.slice(0, 12)}…</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
