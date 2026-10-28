"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { appendEntry } from "@/lib/ledger";
import { getCurrentUser, requireAdmin, SESSION_COOKIE } from "@/lib/auth";
import { nextStage } from "@/lib/constants";
import { getFinancialSummary } from "@/lib/finance";

export async function devLogin(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Unknown user");
  (await cookies()).set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(user.role === "ADMIN" ? "/admin" : "/vote");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}

export async function castVote(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.verified) throw new Error("Only verified members can vote");

  const projectId = String(formData.get("projectId") ?? "");
  const project = await db.project.findUnique({ where: { id: projectId }, include: { round: true } });
  const round = project?.round;
  const now = new Date();
  if (!project || !round || project.stage !== "VOTING") throw new Error("This project is not open for voting");
  if (round.closedAt || now < round.opensAt || now > round.closesAt) throw new Error("Voting round is not open");

  // One verified member, one vote per round. The unique index enforces it
  // even under concurrent requests.
  const existing = await db.vote.findUnique({ where: { userId_roundId: { userId: user.id, roundId: round.id } } });
  if (existing) throw new Error("You have already voted in this round");
  await db.vote.create({ data: { userId: user.id, projectId, roundId: round.id } });

  revalidatePath("/vote");
  revalidatePath(`/projects/${project.slug}`);
}

export async function advanceStage(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) throw new Error("A note explaining the decision is required");

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const to = nextStage(project.stage);
  if (!to) throw new Error("Project has no next stage");
  // Funding has its own action so money and stage move together.
  if (to === "FUNDED") throw new Error("Use 'Authorize funding' to move a project to funded");
  if (to === "VOTING") throw new Error("Add the project to a voting round instead");

  await db.$transaction([
    db.project.update({ where: { id: projectId }, data: { stage: to } }),
    db.stageEvent.create({ data: { projectId, fromStage: project.stage, toStage: to, note, actorId: admin.id } }),
  ]);
  revalidatePath("/", "layout");
}

export async function rejectProject(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) throw new Error("A reason is required when a project is not approved");
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  await db.$transaction([
    db.project.update({ where: { id: projectId }, data: { stage: "REJECTED" } }),
    db.stageEvent.create({ data: { projectId, fromStage: project.stage, toStage: "REJECTED", note, actorId: admin.id } }),
  ]);
  revalidatePath("/", "layout");
}

export async function addToRound(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const roundId = String(formData.get("roundId") ?? "");
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const round = await db.votingRound.findUniqueOrThrow({ where: { id: roundId } });
  if (project.stage !== "UNDER_REVIEW") throw new Error("Only reviewed projects can go to a vote");
  if (round.closedAt) throw new Error("Round is closed");
  await db.$transaction([
    db.project.update({ where: { id: projectId }, data: { stage: "VOTING", roundId } }),
    db.stageEvent.create({
      data: { projectId, fromStage: project.stage, toStage: "VOTING", note: `Passed professional review; added to ${round.title}`, actorId: admin.id },
    }),
  ]);
  revalidatePath("/", "layout");
}

/**
 * Close a round: record the winner if turnout met the threshold. Ties go to
 * the project that reached its vote count first (earliest final vote) —
 * a published rule, see /vote.
 */
export async function closeRound(formData: FormData) {
  await requireAdmin();
  const roundId = String(formData.get("roundId") ?? "");
  const round = await db.votingRound.findUniqueOrThrow({
    where: { id: roundId },
    include: { projects: true, votes: { orderBy: { createdAt: "asc" } } },
  });
  if (round.closedAt) throw new Error("Round already closed");

  const eligible = await db.user.count({ where: { verified: true } });
  const turnoutPct = eligible ? (round.votes.length / eligible) * 100 : 0;

  let winnerProjectId: string | null = null;
  if (turnoutPct >= round.minTurnoutPct) {
    const tally = new Map<string, { n: number; last: number }>();
    round.votes.forEach((v, i) => {
      const t = tally.get(v.projectId) ?? { n: 0, last: 0 };
      tally.set(v.projectId, { n: t.n + 1, last: i });
    });
    const ranked = [...tally.entries()].sort((a, b) => b[1].n - a[1].n || a[1].last - b[1].last);
    winnerProjectId = ranked[0]?.[0] ?? null;
  }

  await db.votingRound.update({ where: { id: roundId }, data: { closedAt: new Date(), winnerProjectId } });
  revalidatePath("/", "layout");
}

/** Community preference does not by itself move money: funds must be available. */
export async function authorizeFunding(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || "Funding authorized";

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId }, include: { round: true } });
  if (project.stage !== "VOTING") throw new Error("Only projects coming out of a vote can be funded here");
  if (!project.round?.closedAt || project.round.winnerProjectId !== project.id) {
    throw new Error("Project must have won a closed voting round");
  }
  const { unallocated } = await getFinancialSummary();
  if (unallocated < project.budgetCents) throw new Error("Not enough unallocated funds for the full budget");

  await db.$transaction(async (tx) => {
    await appendEntry(tx, { type: "ALLOCATION", amountCents: project.budgetCents, memo: note, projectId });
    await tx.project.update({ where: { id: projectId }, data: { stage: "FUNDED" } });
    await tx.stageEvent.create({ data: { projectId, fromStage: "VOTING", toStage: "FUNDED", note, actorId: admin.id } });
  });
  revalidatePath("/", "layout");
}

export async function recordDisbursement(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const amountCents = Math.round(Number(formData.get("amount")) * 100);
  const memo = String(formData.get("memo") ?? "").trim();
  if (!memo) throw new Error("Describe what the disbursement is for");

  await db.$transaction(async (tx) => {
    const sums = await tx.ledgerEntry.groupBy({ by: ["type"], where: { projectId }, _sum: { amountCents: true } });
    const t = (type: string) => sums.find((s) => s.type === type)?._sum.amountCents ?? 0;
    if (amountCents > t("ALLOCATION") - t("DISBURSEMENT")) throw new Error("Disbursement exceeds the project's authorized reserve");
    await appendEntry(tx, { type: "DISBURSEMENT", amountCents, memo, projectId });
  });
  revalidatePath("/", "layout");
}
