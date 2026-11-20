import type { Market } from "@/core/contracts/domain";

/**
 * Fictional probability and activity fixtures for paper trading.
 * Event definitions are illustrative and do not represent live market quotes.
 */
export const marketData: Market[] = [
  {
    id: "mkt-010", slug: "france-2027-first-round-turnout-above-75",
    question: "Will turnout in the first round of France's 2027 presidential election exceed 75%?",
    shortQuestion: "French presidential turnout above 75%?",
    description: "An illustrative election market priced from a synthetic baseline, not polling or an election forecast.",
    category: "Politics", tags: ["France", "Election", "Turnout"], kind: "binary", status: "open",
    imageTone: "lime", icon: "FR",
    outcomes: [
      { id: "yes", label: "Yes", probability: 59, change24h: 1.2, volume24h: 264000 },
      { id: "no", label: "No", probability: 41, change24h: -1.2, volume24h: 208000 }
    ],
    volume: 2840000, volume24h: 472000, liquidity: 385000, traders: 4180,
    endDate: "2027-06-30T00:00:00.000Z", createdAt: "2026-09-09T00:00:00.000Z",
    resolutionSource: "Official French Ministry of the Interior turnout release",
    resolutionRules: "The certified first-round turnout percentage must be strictly greater than 75.00%. A value exactly 75.00% resolves No.",
    chart: [51, 53, 55, 52, 56, 57, 58, 56, 59]
  },
  {
    id: "mkt-011", slug: "eth-price-range-june-2027",
    question: "Which range will ETH/USD close in on June 30, 2027?",
    shortQuestion: "ETH closing range in June 2027?",
    description: "Four mutually exclusive price bands. Prices, chart and volumes are synthetic paper-market data.",
    category: "Crypto", tags: ["Ethereum", "ETH", "Price"], kind: "multi", status: "open",
    imageTone: "lavender", icon: "Ξ",
    outcomes: [
      { id: "under-2500", label: "Below $2.5K", probability: 20, change24h: -1.3, volume24h: 134000 },
      { id: "2500-4000", label: "$2.5K–$4K", probability: 35, change24h: 2.0, volume24h: 315000 },
      { id: "4000-6000", label: "$4K–$6K", probability: 30, change24h: 0.4, volume24h: 248000 },
      { id: "above-6000", label: "Above $6K", probability: 15, change24h: -1.1, volume24h: 116000 }
    ],
    volume: 5260000, volume24h: 813000, liquidity: 622000, traders: 6870,
    endDate: "2027-07-01T00:00:00.000Z", createdAt: "2026-08-14T00:00:00.000Z",
    resolutionSource: "Designated ETH/USD daily close reference",
    resolutionRules: "Use the designated reference's 23:59 UTC June 30, 2027 close. The middle bands include their lower bound and exclude their upper bound.",
    chart: [27, 25, 23, 24, 22, 21, 22, 20]
  },
  {
    id: "mkt-012", slug: "us-core-cpi-december-2027-under-25",
    question: "Will U.S. core CPI inflation for December 2027 be below 2.5% year over year?",
    shortQuestion: "U.S. core inflation below 2.5%?",
    description: "A synthetic macroeconomic market centered on the official December 2027 core CPI release.",
    category: "Economy", tags: ["CPI", "Inflation", "United States"], kind: "binary", status: "open",
    imageTone: "sand", icon: "%",
    outcomes: [
      { id: "yes", label: "Yes", probability: 44, change24h: -2.1, volume24h: 192000 },
      { id: "no", label: "No", probability: 56, change24h: 2.1, volume24h: 252000 }
    ],
    volume: 3190000, volume24h: 444000, liquidity: 475000, traders: 3550,
    endDate: "2028-02-01T00:00:00.000Z", createdAt: "2026-10-01T00:00:00.000Z",
    resolutionSource: "U.S. Bureau of Labor Statistics CPI release",
    resolutionRules: "The first official December 2027 CPI-U all-items-less-food-and-energy twelve-month percentage must be strictly below 2.5%.",
    chart: [50, 48, 49, 51, 47, 45, 46, 44]
  },
  {
    id: "mkt-013", slug: "2027-formula-racing-five-race-winners",
    question: "Will five or more different drivers win a race in the 2027 Formula One season?",
    shortQuestion: "Five F1 race winners in 2027?",
    description: "Count distinct official Grand Prix race winners in the 2027 championship calendar; sprint results do not count.",
    category: "Sports", tags: ["Motorsport", "Formula One", "Racing"], kind: "binary", status: "open",
    imageTone: "peach", icon: "F1",
    outcomes: [
      { id: "yes", label: "Yes", probability: 38, change24h: 1.6, volume24h: 234000 },
      { id: "no", label: "No", probability: 62, change24h: -1.6, volume24h: 345000 }
    ],
    volume: 2950000, volume24h: 579000, liquidity: 350000, traders: 4900,
    endDate: "2027-12-31T23:59:59.000Z", createdAt: "2026-09-23T00:00:00.000Z",
    resolutionSource: "Official Formula One season classification",
    resolutionRules: "Count the number of distinct drivers credited with a Grand Prix race victory in the official 2027 championship results.",
    chart: [29, 32, 31, 34, 36, 33, 35, 38]
  },
  {
    id: "mkt-014", slug: "2027-film-worldwide-boxoffice-15b",
    question: "Will the highest-grossing 2027 film earn more than $1.5 billion worldwide?",
    shortQuestion: "2027 top film grosses over $1.5B?",
    description: "A fictional probability fixture for a box-office milestone, using theatrical worldwide gross.",
    category: "Culture", tags: ["Movies", "Box office", "Film"], kind: "binary", status: "open",
    imageTone: "rose", icon: "✦",
    outcomes: [
      { id: "yes", label: "Yes", probability: 31, change24h: -0.8, volume24h: 126000 },
      { id: "no", label: "No", probability: 69, change24h: 0.8, volume24h: 278000 }
    ],
    volume: 2420000, volume24h: 404000, liquidity: 268000, traders: 3110,
    endDate: "2028-03-31T00:00:00.000Z", createdAt: "2026-10-05T00:00:00.000Z",
    resolutionSource: "Designated worldwide theatrical box-office tracker",
    resolutionRules: "Among films first released in calendar 2027, determine the highest worldwide theatrical gross reported by March 31, 2028. It must exceed $1.5B.",
    chart: [36, 34, 35, 33, 32, 34, 31]
  },
  {
    id: "mkt-015", slug: "commercial-moon-soft-landing-2027",
    question: "Will a commercial lunar lander complete a confirmed soft landing in 2027?",
    shortQuestion: "Commercial Moon soft landing in 2027?",
    description: "Resolves from the public mission record for an uncrewed privately operated lunar lander.",
    category: "Science", tags: ["Moon", "Space", "Lunar"], kind: "binary", status: "open",
    imageTone: "sky", icon: "☾",
    outcomes: [
      { id: "yes", label: "Yes", probability: 73, change24h: 2.4, volume24h: 182000 },
      { id: "no", label: "No", probability: 27, change24h: -2.4, volume24h: 88000 }
    ],
    volume: 1860000, volume24h: 270000, liquidity: 294000, traders: 2570,
    endDate: "2028-01-15T00:00:00.000Z", createdAt: "2026-10-12T00:00:00.000Z",
    resolutionSource: "Official mission operator and space agency status records",
    resolutionRules: "A commercially operated lander must reach the lunar surface with a confirmed controlled soft touchdown between January 1 and December 31, 2027 UTC.",
    chart: [60, 62, 65, 63, 67, 70, 69, 73]
  },
  {
    id: "mkt-016", slug: "production-ev-1000km-wltp-in-2027",
    question: "Will a production electric passenger vehicle receive a certified WLTP range of at least 1,000 km in 2027?",
    shortQuestion: "Production EV certified at 1,000 km?",
    description: "A sample technology benchmark market; concept cars and prototypes do not count.",
    category: "Technology", tags: ["Electric vehicles", "Range", "Battery"], kind: "binary", status: "open",
    imageTone: "coral", icon: "EV",
    outcomes: [
      { id: "yes", label: "Yes", probability: 24, change24h: 0.6, volume24h: 153000 },
      { id: "no", label: "No", probability: 76, change24h: -0.6, volume24h: 312000 }
    ],
    volume: 2090000, volume24h: 465000, liquidity: 315000, traders: 2840,
    endDate: "2028-01-31T00:00:00.000Z", createdAt: "2026-10-17T00:00:00.000Z",
    resolutionSource: "Published WLTP type-approval documentation",
    resolutionRules: "At least one production passenger EV must receive an official WLTP combined-cycle range certification at or above 1,000 km during calendar 2027.",
    chart: [18, 19, 22, 20, 21, 23, 22, 24]
  }
];
