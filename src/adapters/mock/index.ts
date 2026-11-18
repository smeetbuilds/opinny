import type { Market, MarketComment, RewardOpportunity } from "@/core/contracts/domain";
import type { MarketQuery, OpinnyIntegrationAdapter } from "@/core/contracts/ports";
import { appConfig } from "@/lib/config";
import { addPaperComment, cancelPaperOrder, createPaperMarket, executePaperOrder, matchPaperOrder, paperActivity, paperAdminUsers, paperBalances, paperComments, paperMarkets, paperOrderBook, paperOrders, paperPositions, paperResolutionCases, paperTrades, paperTransactions, previewPaperOrder, paperReplyCount, paperUseful, redeemPaperPosition, resetPaperExchange, setPaperMarketStatus, setPaperResolution, setPaperUserStatus, setPaperUseful, settlePaperFunding } from "./simulator";
import {
  adminMetrics,
  leaderboard,
  markets,
  recentTrades,
} from "./data";

const wait = <T,>(value: T) => Promise.resolve(value);
const referenceContract = "0x0000000000000000000000000000000000000001";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildReferenceComments(marketId: string): MarketComment[] {
  const marketIndex = Math.max(markets.findIndex((market) => market.id === marketId), 0);
  const first = leaderboard[marketIndex % leaderboard.length];
  const second = leaderboard[(marketIndex + 2) % leaderboard.length];
  const now = Date.now();

  return [
    {
      id: `${marketId}-comment-1`,
      marketId,
      authorHandle: first.handle,
      authorDisplayName: first.displayName,
      initials: first.initials,
      body: "The current probability looks reasonable, but I am watching liquidity and the resolution source before increasing exposure.",
      createdAt: new Date(now - 18 * 60_000).toISOString(),
      usefulCount: 18 + marketIndex,
      replyCount: 3
    },
    {
      id: `${marketId}-comment-2`,
      marketId,
      authorHandle: second.handle,
      authorDisplayName: second.displayName,
      initials: second.initials,
      body: "The spread has tightened compared with earlier in the session. Limit orders still look preferable for larger positions.",
      createdAt: new Date(now - 67 * 60_000).toISOString(),
      usefulCount: 11 + marketIndex,
      replyCount: 1
    }
  ];
}

function withDiscussionCount(market: Market): Market {
  const comments = buildReferenceComments(market.id);
  return {
    ...market,
    commentCount: comments.length + comments.reduce((sum, comment) => sum + comment.replyCount, 0)
  };
}

function buildRewardOpportunities(): RewardOpportunity[] {
  return markets
    .filter((market) => market.status === "open")
    .slice(0, 12)
    .map((market, index) => {
      const dailyReward = 40 + (index % 5) * 20;
      return {
        id: `reward-${market.id}`,
        marketId: market.id,
        marketSlug: market.slug,
        marketQuestion: market.shortQuestion,
        category: market.category,
        maxSpreadCents: 3 + (index % 3),
        minimumShares: 20 + (index % 4) * 10,
        dailyReward,
        competitionPercent: Math.min(94, 34 + (index * 9) % 58),
        earned: index % 4 === 0 ? Number((dailyReward * 0.18).toFixed(2)) : 0,
        outcomePrices: market.outcomes.slice(0, 3).map((outcome) => ({ label: outcome.label, price: outcome.probability / 100 })),
        eligible: index % 3 !== 2
      };
    });
}

export const mockAdapter: OpinnyIntegrationAdapter = {
  async listMarkets(query?: MarketQuery) {
    let result = paperMarkets().map(withDiscussionCount);
    if (query?.category && query.category !== "All") result = result.filter((market) => market.category === query.category);
    if (query?.search) {
      const term = query.search.toLowerCase();
      result = result.filter((market) => [market.question, market.category, ...market.tags].some((value) => value.toLowerCase().includes(term)));
    }
    if (query?.bookmarked) result = result.filter((market) => market.bookmarked);
    if (query?.status) result = result.filter((market) => market.status === query.status);
    if (query?.sort === "volume") result.sort((a, b) => b.volume - a.volume);
    if (query?.sort === "liquidity") result.sort((a, b) => b.liquidity - a.liquidity);
    if (query?.sort === "newest") result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (query?.sort === "ending") result.sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate));
    if (!query?.sort || query.sort === "trending") result.sort((a, b) => b.volume24h - a.volume24h);
    return wait(result);
  },
  getMarket: (slug) => {
    const market = paperMarkets().find((item) => item.slug === slug);
    return wait(market ? withDiscussionCount(market) : null);
  },
  getOrderBook: (marketId, outcomeId) => wait(paperOrderBook(marketId, outcomeId)),
  getRecentTrades: (marketId) => {
    const market = markets.find((item) => item.id === marketId);
    const reference = market ? recentTrades.map((trade, index) => {
      const outcome = market.outcomes[index % market.outcomes.length];
      const price = outcome.probability / 100;
      return { ...trade, id: marketId + "-" + trade.id, outcome: outcome.label, price, value: Math.round(trade.shares * price * 100) / 100 };
    }) : [];
    return wait([...paperTrades(marketId), ...reference]);
  },
  getMarketComments: (marketId) => wait([...paperComments(marketId), ...buildReferenceComments(marketId).map((comment) => ({ ...comment, viewerUseful: paperUseful(comment.id), replyCount: comment.replyCount + paperReplyCount(comment.id) }))]),
  getRewardOpportunities: () => wait(buildRewardOpportunities()),
  getBalances: () => wait(paperBalances()),
  getPositions: () => wait(paperPositions()),
  getOrders: () => wait(paperOrders()),
  getActivity: () => wait(paperActivity()),
  getLeaderboard: () => wait(leaderboard),
  getMetrics: () => wait(adminMetrics),
  getAnalytics: () => wait({
    volumeSeries: [28, 35, 31, 42, 38, 47, 51, 49, 58, 62, 56, 67, 72, 69, 78, 84, 81, 92, 88, 96, 102, 98, 111, 118, 115, 126, 132, 129, 141, 148],
    volumeTotal: 12_840_000,
    dailyAverage: 428_000,
    peakDay: 512_000,
    settlementRate: 99.4,
    categoryTotal: 48_200_000,
    categories: [{ label: "Crypto", value: 32 }, { label: "Politics", value: 24 }, { label: "Technology", value: 18 }, { label: "Economy", value: 14 }, { label: "Other", value: 12 }]
  }),
  getUsers: () => wait(paperAdminUsers()),
  getResolutionQueue: () => wait(paperResolutionCases()),
  getTransactions: () => wait(paperTransactions()),
  previewOrder: (intent) => wait(previewPaperOrder(intent)),
  prepareOrder: (intent) => wait({
    requestId: intent.clientRequestId,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    preview: previewPaperOrder(intent),
    walletRequest: {
      chainId: appConfig.chainId,
      to: referenceContract,
      data: "0x",
      value: "0x0"
    }
  }),
  confirmOrder: (intent) => {
    try { return wait({ id: intent.clientRequestId, status: "accepted" as const, message: executePaperOrder(intent) }); }
    catch (error) { return wait({ id: intent.clientRequestId, status: "rejected" as const, message: error instanceof Error ? error.message : "Paper order failed." }); }
  },
  cancelOrder: (orderId) => {
    try { return wait({ id: orderId, status: "accepted" as const, message: cancelPaperOrder(orderId) }); }
    catch (error) { return wait({ id: orderId, status: "rejected" as const, message: error instanceof Error ? error.message : "Cancellation failed." }); }
  },
  simulateFillOrder: (orderId) => {
    try { return wait({ id: orderId, status: "accepted" as const, message: matchPaperOrder(orderId) }); }
    catch (error) { return wait({ id: orderId, status: "rejected" as const, message: error instanceof Error ? error.message : "Simulated match failed." }); }
  },
  resetPaperAccount: () => { resetPaperExchange(); return wait({ id: "paper-reset", status: "accepted" as const, message: "Paper account restored to its starting balances and sample positions." }); },
  createMarketComment: (input) => wait(addPaperComment(input)),
  markCommentUseful: (commentId, useful) => {
    setPaperUseful(commentId, useful);
    return wait({ id: commentId, status: "accepted" as const, message: useful ? "Comment marked useful." : "Useful mark removed." });
  },
  redeemPosition: (positionId) => {
    try { return wait({ id: positionId, status: "accepted" as const, message: redeemPaperPosition(positionId) }); }
    catch (error) { return wait({ id: positionId, status: "rejected" as const, message: error instanceof Error ? error.message : "Redemption failed." }); }
  },
  prepareFunding: (intent) => wait({
    requestId: `fund-${Date.now()}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    walletRequest: {
      chainId: intent.chainId,
      to: referenceContract,
      data: "0x",
      value: "0x0"
    }
  }),
  confirmFunding: (intent, requestId) => {
    try { return wait({ id: requestId, status: "accepted" as const, message: settlePaperFunding(intent, requestId) }); }
    catch (error) { return wait({ id: requestId, status: "rejected" as const, message: error instanceof Error ? error.message : "Funding failed." }); }
  },
  createMarket: (input) => {
    try {
      const id = createPaperMarket(input);
      return wait({ id, status: "accepted" as const, message: "Local market draft saved. Publication requires a live backend." });
    } catch (error) {
      return wait({ id: "market-invalid", status: "rejected" as const, message: error instanceof Error ? error.message : "Market draft invalid." });
    }
  },
  updateMarketStatus: (marketId, status) => {
    try { return wait({ id: marketId, status: "accepted" as const, message: setPaperMarketStatus(marketId, status) }); }
    catch (error) { return wait({ id: marketId, status: "rejected" as const, message: error instanceof Error ? error.message : "Status change failed." }); }
  },
  updateUserStatus: (userId, status) => {
    try { return wait({ id: userId, status: "accepted" as const, message: setPaperUserStatus(userId, status) }); }
    catch (error) { return wait({ id: userId, status: "rejected" as const, message: error instanceof Error ? error.message : "User update failed." }); }
  },
  resolveMarket: (caseId, outcome) => {
    try { return wait({ id: caseId, status: "accepted" as const, message: setPaperResolution(caseId, outcome) }); }
    catch (error) { return wait({ id: caseId, status: "rejected" as const, message: error instanceof Error ? error.message : "Resolution failed." }); }
  },
  subscribeToMarket: (marketId, onEvent) => {
    let sequence = 0;
    const update = () => onEvent({ type: "snapshot", marketId, sequence: ++sequence });
    const timer = globalThis.setTimeout(update, 0);
    if (typeof window !== "undefined") window.addEventListener("opinny:paper-update", update);
    return () => {
      globalThis.clearTimeout(timer);
      if (typeof window !== "undefined") window.removeEventListener("opinny:paper-update", update);
    };
  }
};
