// Demo data only. Every project, person and amount here is fictional and
// exists to exercise the product, not to represent real humanitarian work.
import { PrismaClient, type User } from "@prisma/client";
import { appendEntry } from "../src/lib/ledger";

const db = new PrismaClient();
const d = (s: string) => new Date(s);

async function main() {
  await db.stageEvent.deleteMany();
  await db.vote.deleteMany();
  await db.milestone.deleteMany();
  await db.ledgerEntry.deleteMany();
  await db.project.deleteMany();
  await db.votingRound.deleteMany();
  await db.user.deleteMany();

  const admin = await db.user.create({
    data: { name: "Demo Admin", email: "admin@demo.oneimpact", role: "ADMIN", verified: true, monthlyAmountCents: 1500 },
  });

  const tiers = [1000, 1500, 1500, 2500, 5000];
  const members: User[] = [];
  for (let i = 1; i <= 60; i++) {
    members.push(
      await db.user.create({
        data: {
          name: `Demo Member ${String(i).padStart(2, "0")}`,
          email: `member${i}@demo.oneimpact`,
          verified: i <= 55, // a few unverified accounts can't vote
          monthlyAmountCents: tiers[i % tiers.length],
          createdAt: d("2026-04-15"),
        },
      }),
    );
  }

  const julyRound = await db.votingRound.create({
    data: { title: "July 2026 round", opensAt: d("2026-07-10"), closesAt: d("2026-07-24"), closedAt: d("2026-07-24") },
  });
  const augRound = await db.votingRound.create({
    data: { title: "August 2026 round", opensAt: d("2026-08-10"), closesAt: d("2026-08-24"), closedAt: d("2026-08-24") },
  });
  const octRound = await db.votingRound.create({
    data: { title: "October 2026 round", opensAt: d("2026-10-20"), closesAt: d("2026-11-05") },
  });

  const mk = (data: Parameters<typeof db.project.create>[0]["data"]) => db.project.create({ data });

  const water = await mk({
    slug: "shelter-water-filtration",
    title: "Water filtration for a shared shelter",
    summary: "Install and maintain filtration units serving roughly 400 displaced people in a shared shelter.",
    description:
      "Two gravity-fed filtration units, replacement cartridges for six months, and training for shelter volunteers on maintenance and water-quality testing.",
    category: "WATER",
    location: "Gaza (sample location)",
    implementingPartner: "Local water committee (demo partner)",
    budgetCents: 180000,
    stage: "COMPLETED",
    risks: "Supply delays for cartridges; damage to units.",
    roundId: julyRound.id,
    createdAt: d("2026-07-01"),
  });
  const clinic = await mk({
    slug: "mobile-clinic-supplies",
    title: "Medical supplies for a mobile clinic",
    summary: "Three months of essential consumables for a mobile primary-care clinic.",
    description:
      "Wound-care kits, chronic-disease medication bridging stock, and basic diagnostic consumables, procured in three monthly batches against usage reports.",
    category: "HEALTH",
    location: "Gaza (sample location)",
    implementingPartner: "Community health team (demo partner)",
    budgetCents: 240000,
    stage: "IMPLEMENTING",
    risks: "Price volatility; access restrictions delaying deliveries.",
    roundId: augRound.id,
    createdAt: d("2026-08-01"),
  });
  const food = await mk({
    slug: "family-food-parcels",
    title: "Food parcels for 150 families",
    summary: "One month of dry-goods food parcels for 150 households identified by a local distribution committee.",
    description: "Parcels sized to household need, distributed in two rounds with recipient lists reviewed for duplication.",
    category: "FOOD",
    location: "Gaza (sample location)",
    implementingPartner: "Neighbourhood distribution committee (demo partner)",
    budgetCents: 200000,
    stage: "VOTING",
    risks: "Market prices may rise between vote and purchase.",
    roundId: octRound.id,
    createdAt: d("2026-09-20"),
  });
  const shelter = await mk({
    slug: "winter-shelter-kits",
    title: "Winter shelter kits",
    summary: "Insulated tarpaulins, blankets and sealing kits for 80 tents ahead of winter.",
    description: "Kits assembled locally where possible; distribution prioritised by household vulnerability assessment.",
    category: "SHELTER",
    location: "Gaza (sample location)",
    implementingPartner: "Shelter working group (demo partner)",
    budgetCents: 150000,
    stage: "VOTING",
    risks: "Kits may not arrive before the coldest weeks.",
    roundId: octRound.id,
    createdAt: d("2026-09-22"),
  });
  const learning = await mk({
    slug: "temporary-learning-space",
    title: "Temporary learning space",
    summary: "Furnish and run a temporary learning space for 120 children for one term.",
    description: "Tent structure, floor mats, learning materials and stipends for four volunteer teachers.",
    category: "EDUCATION",
    location: "Gaza (sample location)",
    implementingPartner: "Volunteer teachers' network (demo partner)",
    budgetCents: 120000,
    stage: "VOTING",
    risks: "Site may need to relocate at short notice.",
    roundId: octRound.id,
    createdAt: d("2026-09-25"),
  });
  const grants = await mk({
    slug: "small-business-restart-grants",
    title: "Small-business restart grants",
    summary: "Micro-grants to help 25 small traders restart income-generating activity.",
    description: "Grants of a fixed amount with simple business plans and follow-up visits at 1 and 3 months.",
    category: "LIVELIHOODS",
    location: "Gaza (sample location)",
    implementingPartner: "Livelihoods cooperative (demo partner)",
    budgetCents: 300000,
    stage: "UNDER_REVIEW",
    risks: "Selection fairness; market access.",
    createdAt: d("2026-10-05"),
  });
  await mk({
    slug: "clinic-solar-backup",
    title: "Solar backup power for a clinic",
    summary: "Solar panels and batteries to keep a clinic's cold chain running during outages.",
    description: "Proposal awaiting a technical assessment of the site and an itemised quote.",
    category: "HEALTH",
    location: "Gaza (sample location)",
    implementingPartner: "To be confirmed",
    budgetCents: 450000,
    stage: "PROPOSED",
    createdAt: d("2026-10-15"),
  });
  const trucking = await mk({
    slug: "emergency-water-trucking",
    title: "Emergency water trucking",
    summary: "Two weeks of trucked drinking water after a supply line failure.",
    description: "Activated under the emergency procedure; disclosed publicly with the reason below.",
    category: "WATER",
    location: "Gaza (sample location)",
    implementingPartner: "Local water committee (demo partner)",
    budgetCents: 60000,
    stage: "FUNDED",
    isEmergency: true,
    emergencyReason:
      "Supply line failure left an area without drinking water; waiting for the next voting round would have caused serious harm. Capped at the emergency limit and to be reviewed by the community after the fact.",
    createdAt: d("2026-10-18"),
  });

  // Stage history
  const history: [string, string[]][] = [
    [water.id, ["IDENTIFIED", "PROPOSED", "UNDER_REVIEW", "VOTING", "FUNDED", "IMPLEMENTING", "COMPLETED"]],
    [clinic.id, ["IDENTIFIED", "PROPOSED", "UNDER_REVIEW", "VOTING", "FUNDED", "IMPLEMENTING"]],
    [food.id, ["IDENTIFIED", "PROPOSED", "UNDER_REVIEW", "VOTING"]],
    [shelter.id, ["IDENTIFIED", "PROPOSED", "UNDER_REVIEW", "VOTING"]],
    [learning.id, ["IDENTIFIED", "PROPOSED", "UNDER_REVIEW", "VOTING"]],
    [grants.id, ["IDENTIFIED", "PROPOSED", "UNDER_REVIEW"]],
    [trucking.id, ["IDENTIFIED", "FUNDED"]],
  ];
  for (const [projectId, stages] of history) {
    const p = await db.project.findUniqueOrThrow({ where: { id: projectId } });
    for (let i = 0; i < stages.length; i++) {
      await db.stageEvent.create({
        data: {
          projectId,
          fromStage: i === 0 ? null : stages[i - 1],
          toStage: stages[i],
          note: i === 0 ? "Need identified" : stages[i] === "FUNDED" && p.isEmergency ? "Emergency procedure activated" : "Moved forward after review",
          actorId: admin.id,
          createdAt: new Date(p.createdAt.getTime() + i * 3 * 86400000),
        },
      });
    }
  }

  // Votes
  const castVotes = async (roundId: string, split: [string, number][]) => {
    let m = 0;
    for (const [projectId, n] of split) {
      for (let i = 0; i < n; i++, m++) {
        await db.vote.create({ data: { userId: members[m].id, projectId, roundId } });
      }
    }
  };
  await castVotes(julyRound.id, [[water.id, 31]]);
  await castVotes(augRound.id, [[clinic.id, 34]]);
  await castVotes(octRound.id, [[food.id, 14], [shelter.id, 11], [learning.id, 6]]);
  await db.votingRound.update({ where: { id: julyRound.id }, data: { winnerProjectId: water.id } });
  await db.votingRound.update({ where: { id: augRound.id }, data: { winnerProjectId: clinic.id } });

  // Milestones
  const ms = (projectId: string, items: [string, string, string | null][]) =>
    Promise.all(
      items.map(([title, due, done], i) =>
        db.milestone.create({
          data: { projectId, title, dueDate: d(due), completedAt: done ? d(done) : null, evidence: done ? "Photos and receipts on file (demo)" : null, sortOrder: i },
        }),
      ),
    );
  await ms(water.id, [
    ["Units procured", "2026-08-05", "2026-08-03"],
    ["Units installed and tested", "2026-08-15", "2026-08-14"],
    ["Volunteers trained", "2026-08-20", "2026-08-21"],
  ]);
  await ms(clinic.id, [
    ["Batch 1 delivered", "2026-09-10", "2026-09-09"],
    ["Batch 2 delivered", "2026-10-10", "2026-10-12"],
    ["Batch 3 delivered", "2026-11-10", null],
  ]);

  // Ledger, in chronological order so the hash chain reads naturally.
  await db.$transaction(async (tx) => {
    for (const month of ["2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01"]) {
      for (const m of members) {
        await appendEntry(tx, { type: "CONTRIBUTION", amountCents: m.monthlyAmountCents, memo: "Monthly contribution", userId: m.id, createdAt: d(month) });
      }
      await appendEntry(tx, { type: "CONTRIBUTION", amountCents: admin.monthlyAmountCents, memo: "Monthly contribution", userId: admin.id, createdAt: d(month) });
      if (month === "2026-07-01") {
        await appendEntry(tx, { type: "ALLOCATION", amountCents: 180000, memo: "July round winner", projectId: water.id, createdAt: d("2026-07-25") });
        await appendEntry(tx, { type: "DISBURSEMENT", amountCents: 180000, memo: "Paid to partner against procurement quote", projectId: water.id, createdAt: d("2026-07-28") });
        await appendEntry(tx, { type: "OPERATING_COST", amountCents: 9000, memo: "Payment processing fees (Jul)", createdAt: d("2026-07-31") });
      }
      if (month === "2026-08-01") {
        await appendEntry(tx, { type: "ALLOCATION", amountCents: 240000, memo: "August round winner", projectId: clinic.id, createdAt: d("2026-08-25") });
        await appendEntry(tx, { type: "DISBURSEMENT", amountCents: 80000, memo: "Batch 1", projectId: clinic.id, createdAt: d("2026-09-01") });
        await appendEntry(tx, { type: "OPERATING_COST", amountCents: 9500, memo: "Payment processing fees (Aug)", createdAt: d("2026-08-31") });
      }
      if (month === "2026-09-01") {
        await appendEntry(tx, { type: "REFUND", amountCents: 1500, memo: "Duplicate charge refunded", userId: members[3].id, createdAt: d("2026-09-03") });
        await appendEntry(tx, { type: "OPERATING_COST", amountCents: 9500, memo: "Payment processing fees (Sep)", createdAt: d("2026-09-30") });
        await appendEntry(tx, { type: "DISBURSEMENT", amountCents: 80000, memo: "Batch 2", projectId: clinic.id, createdAt: d("2026-10-01") });
      }
      if (month === "2026-10-01") {
        await appendEntry(tx, { type: "ALLOCATION", amountCents: 60000, memo: "Emergency procedure (capped)", projectId: trucking.id, createdAt: d("2026-10-19") });
      }
    }
  }, { timeout: 60000 });

  console.log("Seeded demo data.");
}

main().finally(() => db.$disconnect());
