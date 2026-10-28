import Link from "next/link";
import { STAGES, stageIndex, stageLabel, CATEGORIES } from "@/lib/constants";
import { formatMoney } from "@/lib/finance";

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const tone =
    stage === "REJECTED"
      ? "bg-stone-100 text-stone-600"
      : stage === "VOTING"
        ? "bg-warn-soft text-warn"
        : "bg-brand-soft text-brand";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{stageLabel(stage)}</span>;
}

export function Lifecycle({ stage }: { stage: string }) {
  const current = stageIndex(stage);
  return (
    <ol className="flex flex-wrap gap-y-2 text-xs">
      {STAGES.map((s, i) => {
        const done = current >= 0 && i <= current;
        return (
          <li key={s.key} className="flex items-center">
            <span className={`rounded px-2 py-1 ${i === current ? "bg-brand text-white" : done ? "bg-brand-soft text-brand" : "bg-stone-100 text-muted"}`}>
              {s.label}
            </span>
            {i < STAGES.length - 1 && <span className="mx-1 text-line">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
      <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProjectCard({
  project,
}: {
  project: { slug: string; title: string; summary: string; stage: string; category: string; budgetCents: number; isEmergency: boolean };
}) {
  return (
    <Link href={`/projects/${project.slug}`} className="block rounded-lg border border-line bg-card p-5 hover:border-brand transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <StageBadge stage={project.stage} />
        {project.isEmergency && <span className="rounded-full bg-red-50 text-red-700 px-2.5 py-0.5 text-xs font-medium">Emergency</span>}
        <span className="ml-auto text-xs text-muted">{CATEGORIES[project.category] ?? project.category}</span>
      </div>
      <h3 className="font-semibold">{project.title}</h3>
      <p className="mt-1 text-sm text-muted line-clamp-2">{project.summary}</p>
      <div className="mt-3 text-sm tabular-nums">Budget {formatMoney(project.budgetCents)}</div>
    </Link>
  );
}
