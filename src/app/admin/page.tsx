import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { nextStage, stageLabel } from "@/lib/constants";
import { formatMoney, getFinancialSummary } from "@/lib/finance";
import { StageBadge, Stat } from "@/components/ui";
import { addToRound, advanceStage, authorizeFunding, closeRound, recordDisbursement, rejectProject } from "../actions";

export const dynamic = "force-dynamic";

const input = "rounded-md border border-line bg-white px-2 py-1.5 text-sm";
const btn = "rounded-md bg-brand text-white px-3 py-1.5 text-sm font-medium";
const btnGhost = "rounded-md border border-line px-3 py-1.5 text-sm";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/login");

  const [fin, projects, rounds, eligible] = await Promise.all([
    getFinancialSummary(),
    db.project.findMany({ orderBy: { createdAt: "desc" }, include: { round: true, ledger: true } }),
    db.votingRound.findMany({ orderBy: { opensAt: "desc" }, include: { _count: { select: { votes: true } } } }),
    db.user.count({ where: { verified: true } }),
  ]);
  const openRounds = rounds.filter((r) => !r.closedAt);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-muted">Every action here is recorded in the project&apos;s public decision history or the ledger.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Available to allocate" value={formatMoney(fin.unallocated)} />
        <Stat label="Reserved for projects" value={formatMoney(fin.reserve)} />
        <Stat label="Verified members" value={String(eligible)} />
        <Stat label="Open rounds" value={String(openRounds.length)} />
      </section>

      <section>
        <h2 className="font-semibold mb-3">Voting rounds</h2>
        <div className="space-y-2">
          {rounds.map((r) => {
            const winner = projects.find((p) => p.id === r.winnerProjectId);
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-card p-4 text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="text-muted">{r._count.votes} votes · {eligible ? Math.round((r._count.votes / eligible) * 100) : 0}% turnout (min {r.minTurnoutPct}%)</span>
                <span className="ml-auto">
                  {r.closedAt ? (
                    winner ? <>Winner: <Link href={`/projects/${winner.slug}`} className="text-brand">{winner.title}</Link></> : <span className="text-warn">Closed, no valid result</span>
                  ) : (
                    <form action={closeRound}><input type="hidden" name="roundId" value={r.id} /><button className={btnGhost}>Close round and count</button></form>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Projects</h2>
        <div className="space-y-3">
          {projects.map((p) => {
            const sum = (t: string) => p.ledger.filter((e) => e.type === t).reduce((a, e) => a + e.amountCents, 0);
            const reserve = sum("ALLOCATION") - sum("DISBURSEMENT");
            const next = nextStage(p.stage);
            const wonRound = p.round?.closedAt && p.round.winnerProjectId === p.id;
            return (
              <div key={p.id} className="rounded-lg border border-line bg-card p-4 text-sm space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge stage={p.stage} />
                  <Link href={`/projects/${p.slug}`} className="font-medium hover:underline">{p.title}</Link>
                  <span className="ml-auto text-muted tabular-nums">Budget {formatMoney(p.budgetCents)} · Reserve {formatMoney(reserve)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(p.stage === "IDENTIFIED" || p.stage === "PROPOSED" || p.stage === "FUNDED" || p.stage === "IMPLEMENTING") && next && (
                    <form action={advanceStage} className="flex gap-2">
                      <input type="hidden" name="projectId" value={p.id} />
                      <input name="note" required placeholder="Reason for decision" className={input} />
                      <button className={btn}>Move to {stageLabel(next)}</button>
                    </form>
                  )}
                  {p.stage === "UNDER_REVIEW" && openRounds.length > 0 && (
                    <form action={addToRound} className="flex gap-2">
                      <input type="hidden" name="projectId" value={p.id} />
                      <select name="roundId" className={input}>{openRounds.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select>
                      <button className={btn}>Approve for ballot</button>
                    </form>
                  )}
                  {p.stage === "VOTING" && wonRound && (
                    <form action={authorizeFunding} className="flex gap-2">
                      <input type="hidden" name="projectId" value={p.id} />
                      <input name="note" placeholder="Authorization note" className={input} />
                      <button className={btn} disabled={fin.unallocated < p.budgetCents}>Authorize {formatMoney(p.budgetCents)}</button>
                    </form>
                  )}
                  {reserve > 0 && (
                    <form action={recordDisbursement} className="flex gap-2">
                      <input type="hidden" name="projectId" value={p.id} />
                      <input name="amount" type="number" step="0.01" min="0.01" max={reserve / 100} required placeholder="Amount $" className={`${input} w-28`} />
                      <input name="memo" required placeholder="What it pays for" className={input} />
                      <button className={btnGhost}>Record disbursement</button>
                    </form>
                  )}
                  {["IDENTIFIED", "PROPOSED", "UNDER_REVIEW"].includes(p.stage) && (
                    <form action={rejectProject} className="flex gap-2">
                      <input type="hidden" name="projectId" value={p.id} />
                      <input name="note" required placeholder="Public reason" className={input} />
                      <button className={btnGhost}>Not approved</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
