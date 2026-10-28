import { randomUUID } from "node:crypto";
import type { Store } from "./types";

export function seed(): Store {
  const now = new Date().toISOString();
  return {
    projects: [
      {
        id: randomUUID(),
        title: "Emergency Shelter Repair — Northern Gaza",
        region: "Gaza",
        category: "Shelter",
        summary:
          "Repair tarps, insulation, and basic weatherproofing for 120 displaced families before winter.",
        description:
          "Working with a verified local partner on the ground, this project supplies and installs winterization kits (reinforced tarpaulin, thermal insulation sheets, basic timber framing) for 120 families whose homes were damaged. Each kit covers roughly one shelter unit for an average household of six. Teams coordinate directly with camp coordinators and the municipality, and completed units are photo-documented and GPS-tagged for the public financial dashboard.",
        stage: "community_vote",
        fundingGoal: 24000,
        fundingRaised: 8750,
        votesFor: 342,
        votesAgainst: 18,
        createdAt: now,
      },
      {
        id: randomUUID(),
        title: "Clean Water Delivery — Khan Younis",
        region: "Gaza",
        category: "Water",
        summary:
          "Weekly tanker runs delivering potable water to three displacement sites for 8 weeks.",
        description:
          "A trusted logistics partner runs twice-weekly deliveries of potable water to three displacement sites around Khan Younis, serving roughly 2,400 people. Costs cover fuel, driver, chlorination, and jerrycan distribution. Every delivery is logged with a signed receipt from the site coordinator and published on the project page.",
        stage: "funded",
        fundingGoal: 12000,
        fundingRaised: 12000,
        votesFor: 501,
        votesAgainst: 7,
        createdAt: now,
      },
      {
        id: randomUUID(),
        title: "Mobile Medical Clinic Resupply",
        region: "Gaza",
        category: "Medical",
        summary:
          "Monthly consumables (bandages, antibiotics, insulin) for a mobile clinic serving 600+ patients.",
        description:
          "Keeps a mobile medical clinic stocked for one month: wound-care supplies, broad-spectrum antibiotics, insulin for chronic patients, and basic maternal-health supplies. The clinic rotates between four neighbourhoods and sees roughly 600 patients a month. Procurement goes through a licensed medical supplier; receipts and inventory are published monthly.",
        stage: "under_review",
        fundingGoal: 18500,
        fundingRaised: 0,
        votesFor: 0,
        votesAgainst: 0,
        createdAt: now,
      },
    ],
    members: [],
    pledges: [],
  };
}
