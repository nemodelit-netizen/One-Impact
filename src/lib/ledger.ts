import { createHash } from "node:crypto";
import type { Prisma, PrismaClient, LedgerEntry } from "@prisma/client";
import type { LedgerType } from "./constants";

type Tx = Prisma.TransactionClient | PrismaClient;

export const GENESIS_HASH = "0".repeat(64);

type HashInput = {
  seq: number;
  type: string;
  amountCents: number;
  memo: string;
  userId: string | null;
  projectId: string | null;
  createdAt: Date;
  prevHash: string;
};

export function hashEntry(e: HashInput) {
  const canonical = JSON.stringify([
    e.seq,
    e.type,
    e.amountCents,
    e.memo,
    e.userId,
    e.projectId,
    e.createdAt.toISOString(),
    e.prevHash,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Append an entry to the ledger. Must run inside a transaction so the
 * read of the previous hash and the insert are atomic.
 */
export async function appendEntry(
  tx: Tx,
  data: {
    type: LedgerType;
    amountCents: number;
    memo: string;
    userId?: string | null;
    projectId?: string | null;
    createdAt?: Date;
  },
) {
  if (!Number.isInteger(data.amountCents) || data.amountCents <= 0) {
    throw new Error("Ledger amounts must be positive whole cents");
  }
  const last = await tx.ledgerEntry.findFirst({ orderBy: { seq: "desc" } });
  const seq = (last?.seq ?? 0) + 1;
  const prevHash = last?.hash ?? GENESIS_HASH;
  const createdAt = data.createdAt ?? new Date();
  const userId = data.userId ?? null;
  const projectId = data.projectId ?? null;
  const hash = hashEntry({
    seq,
    type: data.type,
    amountCents: data.amountCents,
    memo: data.memo,
    userId,
    projectId,
    createdAt,
    prevHash,
  });
  return tx.ledgerEntry.create({
    data: { seq, type: data.type, amountCents: data.amountCents, memo: data.memo, userId, projectId, createdAt, prevHash, hash },
  });
}

/** Recompute every hash in order. Returns the first broken seq, if any. */
export function verifyChain(entries: LedgerEntry[]) {
  let prev = GENESIS_HASH;
  for (const e of entries) {
    if (e.prevHash !== prev || hashEntry(e) !== e.hash) {
      return { ok: false as const, brokenAt: e.seq, checked: entries.length };
    }
    prev = e.hash;
  }
  return { ok: true as const, checked: entries.length, head: prev };
}
