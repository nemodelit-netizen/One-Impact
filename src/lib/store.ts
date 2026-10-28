// One Impact — JSON-file persistence layer.
// Thin adapter so the swap to Prisma + Postgres later touches only this file.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Member, Pledge, Project, Store } from "./types";
import { seed } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "one-impact.json");

let writeLock: Promise<unknown> = Promise.resolve();

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(seed(), null, 2), "utf8");
  }
}

async function readStore(): Promise<Store> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Store;
}

async function writeStore(next: Store): Promise<void> {
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

// Serialize all mutations so concurrent requests don't clobber each other.
async function mutate<T>(fn: (store: Store) => Promise<T> | T): Promise<T> {
  const run = async (): Promise<T> => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  };
  const next = writeLock.then(run, run);
  writeLock = next.catch(() => {});
  return next;
}

// ---------- Projects ----------

export async function listProjects(): Promise<Project[]> {
  const store = await readStore();
  return [...store.projects].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export async function getProject(id: string): Promise<Project | null> {
  const store = await readStore();
  return store.projects.find((p) => p.id === id) ?? null;
}

// ---------- Members ----------

const GUEST_EMAIL = "guest@one-impact.local";

export async function getOrCreateGuestMember(): Promise<Member> {
  return mutate(async (store) => {
    let member = store.members.find((m) => m.email === GUEST_EMAIL);
    if (!member) {
      member = {
        id: randomUUID(),
        email: GUEST_EMAIL,
        name: "Guest Supporter",
        monthlyAmount: 15,
        joinedAt: new Date().toISOString(),
      };
      store.members.push(member);
    }
    return member;
  });
}

// ---------- Pledges ----------

export type CreatePledgeInput = {
  projectId: string;
  memberId: string;
  amount: number;
};

export async function createPledge(input: CreatePledgeInput): Promise<Pledge> {
  return mutate(async (store) => {
    const project = store.projects.find((p) => p.id === input.projectId);
    if (!project) throw new Error(`Project not found: ${input.projectId}`);
    const member = store.members.find((m) => m.id === input.memberId);
    if (!member) throw new Error(`Member not found: ${input.memberId}`);

    const pledge: Pledge = {
      id: randomUUID(),
      projectId: input.projectId,
      memberId: input.memberId,
      amount: input.amount,
      createdAt: new Date().toISOString(),
    };
    store.pledges.push(pledge);
    project.fundingRaised = Math.min(
      project.fundingGoal,
      project.fundingRaised + input.amount,
    );
    return pledge;
  });
}

export async function pledgesForProject(projectId: string): Promise<Pledge[]> {
  const store = await readStore();
  return store.pledges.filter((p) => p.projectId === projectId);
}

export async function totals(): Promise<{
  members: number;
  projects: number;
  pledged: number;
}> {
  const store = await readStore();
  const pledged = store.pledges.reduce((sum, p) => sum + p.amount, 0);
  return {
    members: store.members.length,
    projects: store.projects.length,
    pledged,
  };
}
