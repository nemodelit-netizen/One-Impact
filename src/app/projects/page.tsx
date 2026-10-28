import { db } from "@/lib/db";
import { STAGES, stageLabel } from "@/lib/constants";
import { ProjectCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({ orderBy: { createdAt: "desc" } });
  const order = [...STAGES.map((s) => s.key).reverse(), "REJECTED"] as string[];
  const groups = order.map((stage) => ({ stage, items: projects.filter((p) => p.stage === stage) })).filter((g) => g.items.length);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 text-muted max-w-2xl">Every project moves through the same published lifecycle: identified, proposed, professionally reviewed, voted on by members, authorized, implemented, and evaluated.</p>
      </header>
      {groups.map((g) => (
        <section key={g.stage}>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted mb-3">{stageLabel(g.stage)}</h2>
          <div className="grid md:grid-cols-2 gap-4">{g.items.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        </section>
      ))}
    </div>
  );
}
