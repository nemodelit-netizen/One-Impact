import { db } from "./db";

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Pool accounting:
 *   unallocated pool = contributions - refunds - operating costs - allocations
 *   project reserve  = allocations - disbursements  (authorized, not yet paid out)
 */
export async function getFinancialSummary() {
  const sums = await db.ledgerEntry.groupBy({ by: ["type"], _sum: { amountCents: true } });
  const t = (type: string) => sums.find((s) => s.type === type)?._sum.amountCents ?? 0;

  const contributions = t("CONTRIBUTION");
  const refunds = t("REFUND");
  const operating = t("OPERATING_COST");
  const allocated = t("ALLOCATION");
  const disbursed = t("DISBURSEMENT");

  const netContributions = contributions - refunds;
  return {
    contributions,
    refunds,
    operating,
    allocated,
    disbursed,
    unallocated: netContributions - operating - allocated,
    reserve: allocated - disbursed,
    operatingRatio: netContributions > 0 ? operating / netContributions : 0,
  };
}

export async function getProjectFunding(projectId: string) {
  const sums = await db.ledgerEntry.groupBy({
    by: ["type"],
    where: { projectId },
    _sum: { amountCents: true },
  });
  const t = (type: string) => sums.find((s) => s.type === type)?._sum.amountCents ?? 0;
  return { allocated: t("ALLOCATION"), disbursed: t("DISBURSEMENT") };
}
