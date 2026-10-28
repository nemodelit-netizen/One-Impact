import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/finance";
import { Progress } from "@/components/ui";
import { castVote } from "../actions";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

export default async function VotePage() {
  const user = await getCurrentUser();
  const now = new Date();
  const round = await db.votingRound.findFirst({
    where: { closedAt: null },
    orderBy: { opensAt: "desc" },
    include: { projects: { where: { stage: "VOTING" }, include: { _count: { select: { votes: true } } } }, votes: true },
  });
  const eligible = await db.user.count({ where: { verified: true } });

  if (!round) return <p className="text-muted">No voting round is open right now.</p>;

  const isOpen = now >= round.opensAt && now <= round.closesAt;
  const myVote = user ? round.votes.find((v) => v.userId === user.id) : undefined;
  const total = round.votes.length;
  const turnout = eligible ? Math.round((total / eligible) * 100) : 0;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{round.title}</h1>
        <p className="mt-2 text-muted">
          {isOpen ? "Open" : "Scheduled"} {fmtDate(round.opensAt)} to {fmtDate(round.closesAt)} · {total} of {eligible} verified members have voted ({turnout}% turnout, {round.minTurnoutPct}% needed)
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        {round.projects.map((p) => {
          const mine = myVote?.projectId === p.id;
          return (
            <div key={p.id} className={`rounded-lg border bg-card p-5 flex flex-col ${mine ? "border-brand" : "border-line"}`}>
              <h3 className="font-semibold"><Link href={`/projects/${p.slug}`} className="hover:underline">{p.title}</Link></h3>
              <p className="mt-1 text-sm text-muted flex-1">{p.summary}</p>
              <div className="mt-3 text-sm tabular-nums">Budget {formatMoney(p.budgetCents)}</div>
              <div className="mt-3 space-y-1">
                <Progress value={p._count.votes} max={Math.max(total, 1)} />
                <div className="text-xs text-muted tabular-nums">{p._count.votes} votes</div>
              </div>
              <div className="mt-4">
                {mine ? (
                  <div className="text-center text-sm font-medium text-brand">✓ Your vote</div>
                ) : !user ? (
                  <Link href="/login" className="block text-center rounded-md border border-line px-3 py-2 text-sm">Sign in to vote</Link>
                ) : myVote || !isOpen || !user.verified ? null : (
                  <form action={castVote}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <button className="w-full rounded-md bg-brand text-white px-3 py-2 text-sm font-medium">Vote for this project</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </section>
      {user && !user.verified && <p className="text-sm text-warn">Your membership isn&apos;t verified yet, so you can&apos;t vote in this round.</p>}

      <section className="rounded-lg border border-line bg-card p-6 text-sm">
        <h2 className="font-semibold mb-3">Voting rules</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-muted">
          <li>Every verified member gets one vote per round, cast for one project. Votes can&apos;t be changed once cast.</li>
          <li>Only projects that passed professional review appear on the ballot.</li>
          <li>The result is valid only if at least {round.minTurnoutPct}% of verified members vote.</li>
          <li>Ties go to the project that reached its final vote count first.</li>
          <li>Winning a vote sets community preference. Funds are released only once budget, compliance and financial checks pass. If a winner becomes infeasible, that is published along with what happens next.</li>
          <li>People involved in a project must disclose it and may not vote in that round.</li>
        </ul>
      </section>
    </div>
  );
}
