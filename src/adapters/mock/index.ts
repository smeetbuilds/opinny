import type { OrderIntent, OrderPreview } from "@/core/contracts/domain";
import type { MarketQuery, OpinnyIntegrationAdapter } from "@/core/contracts/ports";
import {
  activity,
  adminMetrics,
  adminUsers,
  leaderboard,
  markets,
  orderBook,
  orders,
  positions,
  recentTrades,
  resolutions,
  transactions
} from "./data";

const wait = <T,>(value: T) => Promise.resolve(value);
const demoContract = "0x0000000000000000000000000000000000000001";

function buildOrderPreview(intent: OrderIntent): OrderPreview {
  const market = markets.find((item) => item.id === intent.marketId);
  const outcome = market?.outcomes.find((item) => item.id === intent.outcomeId);
  const estimatedPrice = intent.limitPrice ?? (outcome?.probability ?? 50) / 100;
  const estimatedShares = intent.side === "buy"
    ? (intent.collateralAmount ?? 0) / Math.max(estimatedPrice, 0.01)
    : intent.shares ?? 0;
  const estimatedCollateral = intent.side === "buy"
    ? intent.collateralAmount ?? 0
    : estimatedShares * estimatedPrice;

  return {
    estimatedPrice,
    estimatedShares,
    estimatedCollateral,
    estimatedFee: estimatedCollateral * 0.001,
    priceImpactBps: Math.min(80, Math.round(estimatedCollateral / 25))
  };
}

export const mockAdapter: OpinnyIntegrationAdapter = {
  async listMarkets(query?: MarketQuery) {
    let result = [...markets];
    if (query?.category && query.category !== "All") {
      result = result.filter((market) => market.category === query.category);
    }
    if (query?.search) {
      const term = query.search.toLowerCase();
      result = result.filter((market) =>
        [market.question, market.category, ...market.tags].some((value) => value.toLowerCase().includes(term))
      );
    }
    if (query?.bookmarked) result = result.filter((market) => market.bookmarked);
    if (query?.status) result = result.filter((market) => market.status === query.status);
    if (query?.sort === "volume") result.sort((a, b) => b.volume - a.volume);
    if (query?.sort === "newest") result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (query?.sort === "ending") result.sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate));
    if (!query?.sort || query.sort === "trending") result.sort((a, b) => b.volume24h - a.volume24h);
    return wait(result);
  },
  getMarket: (slug) => wait(markets.find((market) => market.slug === slug) ?? null),
  getOrderBook: () => wait(orderBook),
  getRecentTrades: () => wait(recentTrades),
  getPositions: () => wait(positions),
  getOrders: () => wait(orders),
  getActivity: () => wait(activity),
  getLeaderboard: () => wait(leaderboard),
  getMetrics: () => wait(adminMetrics),
  getUsers: () => wait(adminUsers),
  getResolutionQueue: () => wait(resolutions),
  getTransactions: () => wait(transactions),
  previewOrder: (intent) => wait(buildOrderPreview(intent)),
  prepareOrder: (intent) => wait({
    requestId: intent.clientRequestId,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    preview: buildOrderPreview(intent),
    walletRequest: {
      chainId: 137,
      to: demoContract,
      data: "0x",
      value: "0x0"
    }
  }),
  cancelOrder: (orderId) => wait({ id: orderId, status: "accepted", message: "Demo cancellation accepted." }),
  prepareFunding: (intent) => wait({
    requestId: `fund-${Date.now()}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    walletRequest: {
      chainId: intent.chainId,
      to: demoContract,
      data: "0x",
      value: "0x0"
    }
  }),
  createMarket: () => wait({ id: `market-${Date.now()}`, status: "accepted", message: "Demo market draft created." }),
  updateUserStatus: (userId, status) => wait({ id: userId, status: "accepted", message: `Demo user status changed to ${status}.` }),
  resolveMarket: (caseId, outcome) => wait({ id: caseId, status: "accepted", message: `Demo resolution prepared for ${outcome}.` }),
  subscribeToMarket: (marketId, onEvent) => {
    const timer = globalThis.setTimeout(() => onEvent({ type: "snapshot", marketId, sequence: 1 }), 0);
    return () => globalThis.clearTimeout(timer);
  }
};
