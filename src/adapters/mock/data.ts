import type {
  ActivityItem,
  AdminMetric,
  AdminUser,
  LeaderboardEntry,
  OrderBookLevel,
  Position,
  RecentTrade,
  ResolutionCase,
  TransactionRecord,
  UserOrder
} from "@/core/contracts/domain";
import { marketData as marketDataA } from "./market-data-a";
import { marketData as marketDataB } from "./market-data-b";

export const categories = ["All", "Politics", "Crypto", "Sports", "Technology", "Economy", "Culture", "Science"];

export const markets = [...marketDataA, ...marketDataB];

export const orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] } = {
  asks: [
    { price: 0.68, size: 1200, total: 1200 },
    { price: 0.67, size: 2400, total: 3600 },
    { price: 0.66, size: 3100, total: 6700 },
    { price: 0.65, size: 5800, total: 12500 }
  ],
  bids: [
    { price: 0.62, size: 4200, total: 4200 },
    { price: 0.61, size: 3600, total: 7800 },
    { price: 0.6, size: 6900, total: 14700 },
    { price: 0.59, size: 5100, total: 19800 }
  ]
};

export const recentTrades: RecentTrade[] = [
  { id: "tr-1", side: "buy", outcome: "Yes", price: 0.63, shares: 420, value: 264.6, trader: "0x19B…7A42", time: "12 sec" },
  { id: "tr-2", side: "sell", outcome: "Yes", price: 0.62, shares: 180, value: 111.6, trader: "0xA31…3D09", time: "41 sec" },
  { id: "tr-3", side: "buy", outcome: "No", price: 0.37, shares: 760, value: 281.2, trader: "0x6C0…8F10", time: "1 min" },
  { id: "tr-4", side: "buy", outcome: "Yes", price: 0.63, shares: 1100, value: 693, trader: "0x3E8…19D4", time: "3 min" }
];

export const positions: Position[] = [
  { id: "pos-1", marketId: "mkt-001", marketSlug: markets[0].slug, marketQuestion: markets[0].shortQuestion, outcome: "Yes", shares: 1240, averagePrice: 0.51, currentPrice: 0.63, value: 781.2, pnl: 148.8, pnlPercent: 23.5, status: "open" },
  { id: "pos-2", marketId: "mkt-004", marketSlug: markets[3].slug, marketQuestion: markets[3].shortQuestion, outcome: "Yes", shares: 900, averagePrice: 0.36, currentPrice: 0.41, value: 369, pnl: 45, pnlPercent: 13.9, status: "open" },
  { id: "pos-3", marketId: "mkt-005", marketSlug: markets[4].slug, marketQuestion: markets[4].shortQuestion, outcome: "No", shares: 620, averagePrice: 0.61, currentPrice: 0.66, value: 409.2, pnl: 31, pnlPercent: 8.2, status: "open" },
  { id: "pos-4", marketId: "mkt-007", marketSlug: markets[6].slug, marketQuestion: markets[6].shortQuestion, outcome: "Yes", shares: 500, averagePrice: 0.22, currentPrice: 0.18, value: 90, pnl: -20, pnlPercent: -18.2, status: "open" },
  { id: "pos-5", marketId: "mkt-009", marketSlug: markets[8].slug, marketQuestion: markets[8].shortQuestion, outcome: "Yes", shares: 486, averagePrice: 0.54, currentPrice: 1, value: 486, pnl: 223.56, pnlPercent: 85.2, status: "resolved", claimableAmount: 486, resolvedOutcome: "Yes", resolvedAt: "2026-07-01T12:20:00.000Z" }
];

export const orders: UserOrder[] = [
  { id: "ord-1", marketQuestion: markets[2].shortQuestion, marketSlug: markets[2].slug, outcome: "2 cuts", side: "buy", type: "limit", price: 0.34, shares: 800, filled: 240, status: "partially-filled", createdAt: "2026-08-03T10:24:00.000Z" },
  { id: "ord-2", marketQuestion: markets[5].shortQuestion, marketSlug: markets[5].slug, outcome: "Yes", side: "buy", type: "limit", price: 0.24, shares: 450, filled: 0, status: "open", createdAt: "2026-08-02T18:42:00.000Z" },
  { id: "ord-3", marketQuestion: markets[0].shortQuestion, marketSlug: markets[0].slug, outcome: "Yes", side: "buy", type: "market", price: 0.51, shares: 1240, filled: 1240, status: "filled", createdAt: "2026-07-28T08:11:00.000Z" }
];

export const activity: ActivityItem[] = [
  { id: "act-1", type: "trade", title: "Bought 420 Yes shares", description: markets[0].shortQuestion, amount: -264.6, time: "12 minutes ago" },
  { id: "act-2", type: "reward", title: "Liquidity reward received", description: "Weekly maker programme", amount: 18.42, time: "4 hours ago" },
  { id: "act-3", type: "deposit", title: "Crypto deposit confirmed", description: "USDC on Polygon", amount: 1200, time: "Yesterday" },
  { id: "act-4", type: "resolution", title: "Position ready to redeem", description: markets[8].shortQuestion, amount: 486, time: "Jul 31" },
  { id: "act-5", type: "withdrawal", title: "Withdrawal sent", description: "USDC to 0x48B…39C2", amount: -300, time: "Jul 29" }
];

export const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    handle: "signalcraft",
    displayName: "Signal Craft",
    initials: "SC",
    profit: 128420,
    weeklyProfit: 12480,
    monthlyProfit: 48200,
    allTimeProfit: 128420,
    volume: 1240000,
    accuracy: 71,
    streak: 8,
    categories: ["Crypto", "Technology"],
    bio: "Macro, technology and crypto markets with patient entries and explicit exit levels.",
    joinedAt: "May 11, 2026",
    wallet: "0x19B60F0A4218D3E54A6FBD7A42C8B8F0D9E7A42A",
    followers: 8412
  },
  {
    rank: 2,
    handle: "bayesrunner",
    displayName: "Bayes Runner",
    initials: "BR",
    profit: 109840,
    weeklyProfit: 15120,
    monthlyProfit: 42180,
    allTimeProfit: 109840,
    volume: 980000,
    accuracy: 69,
    streak: 11,
    categories: ["Politics", "Economy"],
    bio: "Event-driven political and economic forecasts grounded in base rates and public data.",
    joinedAt: "May 14, 2026",
    wallet: "0xA31F89C42D09AB8E7119C8D2B73DAB66D5C13D09",
    followers: 7190
  },
  {
    rank: 3,
    handle: "probabilitylab",
    displayName: "Probability Lab",
    initials: "PL",
    profit: 96310,
    weeklyProfit: 9380,
    monthlyProfit: 39420,
    allTimeProfit: 96310,
    volume: 1430000,
    accuracy: 66,
    streak: 5,
    categories: ["Science", "Technology"],
    bio: "Research-led forecasts focused on science, AI and long-horizon technology outcomes.",
    joinedAt: "May 22, 2026",
    wallet: "0x71C3A9E842E6D2C5A1B14056F7D917C9F3E1842E",
    followers: 6244
  },
  {
    rank: 4,
    handle: "marketmosaic",
    displayName: "Market Mosaic",
    initials: "MM",
    profit: 84590,
    weeklyProfit: 10820,
    monthlyProfit: 36110,
    allTimeProfit: 84590,
    volume: 760000,
    accuracy: 68,
    streak: 7,
    categories: ["Culture", "Sports"],
    bio: "Cross-category trader combining cultural signals, sports data and disciplined sizing.",
    joinedAt: "June 3, 2026",
    wallet: "0xD81466A9C53B12E8F460A4F28CE892E566A966A9",
    followers: 5318
  },
  {
    rank: 5,
    handle: "eventhorizon",
    displayName: "Event Horizon",
    initials: "EH",
    profit: 72150,
    weeklyProfit: 7120,
    monthlyProfit: 29840,
    allTimeProfit: 72150,
    volume: 690000,
    accuracy: 64,
    streak: 4,
    categories: ["Science", "Crypto"],
    bio: "High-conviction positions in space, science and digital-asset event markets.",
    joinedAt: "June 12, 2026",
    wallet: "0x2E1B992A403D27C609EC61AABF2CD09A17D6992A",
    followers: 4176
  },
  {
    rank: 6,
    handle: "marketpilot",
    displayName: "Market Pilot",
    initials: "MP",
    profit: 68120,
    weeklyProfit: 8460,
    monthlyProfit: 27460,
    allTimeProfit: 68120,
    volume: 580000,
    accuracy: 67,
    streak: 6,
    categories: ["Economy", "Politics", "Crypto"],
    bio: "Diversified event-market portfolio with an emphasis on liquidity and risk control.",
    joinedAt: "June 18, 2026",
    wallet: "0x48B82F39C2A41B70D10F83B22D17849803D239C2",
    followers: 3821
  }
];

export const adminMetrics: AdminMetric[] = [
  { label: "Total volume", value: "$48.2M", change: 12.8, hint: "Trailing 30 days" },
  { label: "Open interest", value: "$9.84M", change: 8.4, hint: "Across active markets" },
  { label: "Active traders", value: "38,421", change: 6.7, hint: "Trailing 30 days" },
  { label: "Pending resolutions", value: "18", change: -10.0, hint: "6 require action" }
];

export const adminUsers: AdminUser[] = [
  { id: "usr-1001", handle: "signalcraft", wallet: "0x19B60F0A4218D3E54A6FBD7A42", joined: "May 11, 2026", volume: 1240000, balance: 86420, status: "active", risk: "low" },
  { id: "usr-1002", handle: "bayesrunner", wallet: "0xA31F89C42D09AB8E7119C8", joined: "May 14, 2026", volume: 980000, balance: 55870, status: "active", risk: "low" },
  { id: "usr-1003", handle: "fastarb", wallet: "0x6C0A93C5E18F10D82A3D", joined: "Jun 02, 2026", volume: 2410000, balance: 124200, status: "review", risk: "high" },
  { id: "usr-1004", handle: "trendatlas", wallet: "0x3E89C7A19D4B02C16F6A", joined: "Jun 27, 2026", volume: 420000, balance: 22840, status: "active", risk: "medium" },
  { id: "usr-1005", handle: "quietedge", wallet: "0x48B82F39C2A41B70D10F", joined: "Jul 08, 2026", volume: 186000, balance: 9840, status: "suspended", risk: "high" }
];

export const resolutions: ResolutionCase[] = [
  { id: "res-201", market: "Will the research launch occur in Q2?", endDate: "Jul 31, 2026", proposedOutcome: "Yes", source: "Official launch log", disputes: 0, status: "proposed" },
  { id: "res-202", market: "Will the inflation print be below 3.0%?", endDate: "Aug 2, 2026", proposedOutcome: "No", source: "Statistics release", disputes: 3, status: "disputed" },
  { id: "res-203", market: "Will Team North win the regional final?", endDate: "Aug 3, 2026", proposedOutcome: "Team North", source: "Official match result", disputes: 0, status: "awaiting" },
  { id: "res-204", market: "Will the governance proposal pass?", endDate: "Aug 3, 2026", proposedOutcome: "Yes", source: "Onchain vote", disputes: 0, status: "approved" }
];

export const transactions: TransactionRecord[] = [
  { id: "tx-301", type: "deposit", wallet: "0x19B…7A42", asset: "USDC", amount: 1200, txHash: "0x91af…38d1", status: "confirmed", time: "2 min ago" },
  { id: "tx-302", type: "trade", wallet: "0xA31…3D09", asset: "USDC", amount: 842.4, txHash: "0x71c3…842e", status: "confirmed", time: "7 min ago" },
  { id: "tx-303", type: "withdrawal", wallet: "0x48B…39C2", asset: "USDC", amount: 300, txHash: "0x4b9e…c0f2", status: "pending", time: "11 min ago" },
  { id: "tx-304", type: "reward", wallet: "0x3E8…19D4", asset: "USDC", amount: 18.42, txHash: "0xd814…66a9", status: "confirmed", time: "21 min ago" },
  { id: "tx-305", type: "deposit", wallet: "0x6C0…8F10", asset: "USDC", amount: 4500, txHash: "0x2e1b…992a", status: "failed", time: "34 min ago" }
];
