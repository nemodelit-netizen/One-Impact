import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CATEGORIES, LEDGER_TYPES, stageLabel, type LedgerType } from "@/lib/constants";
import { formatMoney, getProjectFunding } from "@/lib/finance";
import { Lifecycle, Progress, StageBadge, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await db.project.findUnique({
    where: { slug },
    include: {
      round: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      stageEvents: { orderBy: { createdAt: "asc" } },
      ledger: { orderBy: { seq: "asc" } },
      _count: { select: { votes: true } },
    },
  });
  if (!project) notFound();
  const funding = await getProjectFunding(project.id);

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <Link href="/projects" className="text-sm text-muted">← Projects</Link>
        <div className="flex items-center gap-2">
          <StageBadge stage={project.stage} />
          <span className="text-xs text-muted">{CATEGORIES[project.category]} · {project.location}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
        <p className="text-lg text-muted max-w-2xl">{project.summary}</p>
        <Lifecycle stage={project.stage} />
      </header>

      {project.isEmergency && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Funded under the emergency procedure.</strong> {project.emergencyReason}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Budget" value={formatMoney(project.budgetCents)} />
        <Stat label="Authorized" value={formatMoney(funding.allocated)} />
        <Stat label="Disbursed" value={formatMoney(funding.disbursed)} />
        <Stat label="Votes" value={String(project._count.votes)} hint={project.round?.title} />
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="font-semibold mb-2">About this project</h2>
            <p className="text-sm leading-relaxed">{project.description}</p>
            <dl className="mt-4 text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-muted">Implementing partner</dt><dd>{project.implementingPartner}</dd>
              {project.risks && (<><dt className="text-muted">Known risks</dt><dd>{project.risks}</dd></>)}
            </dl>
          </div>

          {project.milestones.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Milestones</h2>
              <Progress value={project.milestones.filter((m) => m.completedAt).length} max={project.milestones.length} />
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-card text-sm">
                {project.milestones.map((m) => (
                  <li key={m.id} className="flex items-start gap-3 p-3">
                    <span className={m.completedAt ? "text-brand" : "text-muted"}>{m.completedAt ? "✓" : "○"}</span>
                    <div className="flex-1">
                      <div>{m.title}</div>
                      {m.evidence && <div className="text-xs text-muted">{m.evidence}</div>}
                    </div>
                    <span className="text-xs text-muted">{m.completedAt ? `Done ${fmtDate(m.completedAt)}` : `Due ${fmtDate(m.dueDate)}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="font-semibold mb-2">Money for this project</h2>
            {project.ledger.length === 0 ? (
              <p className="text-sm text-muted">No funds have been authorized yet.</p>
            ) : (
              <table className="w-full text-sm rounded-lg border border-line bg-card">
                <tbody className="divide-y divide-line">
                  {project.ledger.map((e) => (
                    <tr key={e.seq}>
                      <td className="p-3 text-muted">{fmtDate(e.createdAt)}</td>
                      <td className="p-3">{LEDGER_TYPES[e.type as LedgerType]}<div className="text-xs text-muted">{e.memo}</div></td>
                      <td className="p-3 text-right tabular-nums">{formatMoney(e.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside>
          <h2 className="font-semibold mb-2">Decision history</h2>
          <ol className="space-y-3 text-sm border-l border-line pl-4">
            {project.stageEvents.map((e) => (
              <li key={e.id}>
                <div className="font-medium">{stageLabel(e.toStage)}</div>
                <div className="text-muted">{e.note}</div>
                <div className="text-xs text-muted">{fmtDate(e.createdAt)}</div>
              </li>
            ))}
          </ol>
          {project.stage === "VOTING" && (
            <Link href="/vote" className="mt-6 block text-center rounded-md bg-brand text-white px-4 py-2 text-sm font-medium">Vote in {project.round?.title}</Link>
          )}
        </aside>
      </section>
    </article>
  );
}
