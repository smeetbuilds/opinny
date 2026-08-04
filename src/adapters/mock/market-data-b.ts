import type { Market } from "@/core/contracts/domain";

export const marketData: Market[] = [
{
    id: "mkt-005",
    slug: "moon-mission-launch-2027",
    question: "Will the next crewed lunar mission launch before July 2027?",
    shortQuestion: "Crewed lunar mission before July 2027?",
    description: "Resolves Yes if the designated crewed lunar mission lifts off before the deadline, regardless of later mission outcome.",
    category: "Science",
    tags: ["Space", "Moon", "Launch"],
    kind: "binary",
    status: "open",
    imageTone: "sky",
    icon: "☾",
    outcomes: [
      { id: "yes", label: "Yes", probability: 34, change24h: -2.4, volume24h: 390000 },
      { id: "no", label: "No", probability: 66, change24h: 2.4, volume24h: 520000 }
    ],
    volume: 3920000,
    volume24h: 910000,
    liquidity: 480000,
    traders: 5460,
    endDate: "2027-07-01T00:00:00.000Z",
    createdAt: "2026-05-29T00:00:00.000Z",
    resolutionSource: "Official mission launch record",
    resolutionRules: "Liftoff must occur before 00:00 UTC on July 1, 2027.",
    chart: [52, 50, 47, 45, 43, 46, 42, 40, 38, 36, 34]
  },
{
    id: "mkt-006",
    slug: "championship-final-seven-games",
    question: "Will the 2027 professional basketball championship final reach Game 7?",
    shortQuestion: "Championship final reaches Game 7?",
    description: "Resolves Yes if the final series requires a seventh game to determine the champion.",
    category: "Sports",
    tags: ["Basketball", "Finals"],
    kind: "binary",
    status: "open",
    imageTone: "peach",
    icon: "7",
    outcomes: [
      { id: "yes", label: "Yes", probability: 27, change24h: 0.7, volume24h: 280000 },
      { id: "no", label: "No", probability: 73, change24h: -0.7, volume24h: 450000 }
    ],
    volume: 2680000,
    volume24h: 730000,
    liquidity: 360000,
    traders: 3980,
    endDate: "2027-06-30T00:00:00.000Z",
    createdAt: "2026-07-18T00:00:00.000Z",
    resolutionSource: "Official league record",
    resolutionRules: "The championship series schedule and completed games determine the outcome.",
    chart: [24, 25, 25, 26, 25, 27, 28, 26, 27]
  },
{
    id: "mkt-007",
    slug: "global-box-office-2b-2027",
    question: "Will any film earn more than $2 billion worldwide in 2027?",
    shortQuestion: "Any 2027 film above $2B worldwide?",
    description: "Resolves Yes if a film first released in 2027 reaches a reported worldwide gross above $2 billion.",
    category: "Culture",
    tags: ["Film", "Box Office"],
    kind: "binary",
    status: "open",
    imageTone: "rose",
    icon: "✦",
    outcomes: [
      { id: "yes", label: "Yes", probability: 18, change24h: 1.5, volume24h: 240000 },
      { id: "no", label: "No", probability: 82, change24h: -1.5, volume24h: 410000 }
    ],
    volume: 2100000,
    volume24h: 650000,
    liquidity: 290000,
    traders: 3320,
    endDate: "2028-03-31T00:00:00.000Z",
    createdAt: "2026-07-12T00:00:00.000Z",
    resolutionSource: "Designated worldwide box-office tracker",
    resolutionRules: "Worldwide theatrical gross only. Re-releases are included if the film's first release was in 2027.",
    chart: [15, 16, 15, 17, 16, 18, 19, 18]
  },
{
    id: "mkt-008",
    slug: "major-city-mayoral-turnout-60",
    question: "Will voter turnout exceed 60% in the selected 2027 mayoral election?",
    shortQuestion: "Mayoral turnout above 60%?",
    description: "Resolves from the certified turnout figure published by the municipal election authority.",
    category: "Politics",
    tags: ["Elections", "Turnout"],
    kind: "binary",
    status: "open",
    imageTone: "lime",
    icon: "✓",
    outcomes: [
      { id: "yes", label: "Yes", probability: 56, change24h: -0.4, volume24h: 310000 },
      { id: "no", label: "No", probability: 44, change24h: 0.4, volume24h: 260000 }
    ],
    volume: 3320000,
    volume24h: 570000,
    liquidity: 420000,
    traders: 4190,
    endDate: "2027-11-30T00:00:00.000Z",
    createdAt: "2026-06-19T00:00:00.000Z",
    resolutionSource: "Certified municipal election results",
    resolutionRules: "The official certified turnout percentage determines resolution.",
    chart: [49, 50, 51, 50, 52, 53, 54, 55, 56]
  }
];
