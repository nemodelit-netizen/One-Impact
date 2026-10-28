import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney, getFinancialSummary } from "@/lib/finance";
import { ProjectCard, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [fin, members, monthly, voting, active] = await Promise.all([
    getFinancialSummary(),
    db.user.count(),
    db.user.aggregate({ _sum: { monthlyAmountCents: true } }),
    db.project.findMany({ where: { stage: "VOTING" }, take: 3 }),
    db.project.count({ where: { stage: { in: ["FUNDED", "IMPLEMENTING"] } } }),
  ]);

  return (
    <div className="space-y-12">
      <section className="max-w-2xl">
        <p className="text-sm font-medium text-brand">Beginning with Gaza</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">People united by purpose can create measurable, lasting change.</h1>
        <p className="mt-4 text-lg text-muted">
          Members contribute a small amount every month. Together they vote on professionally vetted humanitarian projects, and every dollar in and out is published.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/vote" className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium">See the current vote</Link>
          <Link href="/transparency" className="rounded-md border border-line bg-card px-4 py-2 text-sm font-medium">Where the money goes</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Members" value={members.toLocaleString()} />
        <Stat label="Committed monthly" value={formatMoney(monthly._sum.monthlyAmountCents ?? 0)} />
        <Stat label="Disbursed to projects" value={formatMoney(fin.disbursed)} />
        <Stat label="Active projects" value={String(active)} />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold">Open for community vote</h2>
          <Link href="/projects" className="text-sm text-brand">All projects →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {voting.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>
    </div>
  );
}
