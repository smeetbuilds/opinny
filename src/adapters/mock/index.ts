import type { Market, MarketComment, RewardOpportunity } from "@/core/contracts/domain";
import type { MarketQuery, OpinnyIntegrationAdapter } from "@/core/contracts/ports";
import { appConfig } from "@/lib/config";
import { addPaperComment, cancelPaperOrder, executePaperOrder, matchPaperOrder, paperActivity, paperBalances, paperComments, paperOrderBook, paperOrders, paperPositions, paperTrades, previewPaperOrder, paperReplyCount, paperUseful, redeemPaperPosition, resetPaperExchange, setPaperUseful, settlePaperFunding } from "./simulator";
import {
  adminMetrics,
  adminUsers,
  leaderboard,
  markets,
  recentTrades,
  resolutions,
  transactions
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
    let result = markets.map(withDiscussionCount);
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
    const market = markets.find((item) => item.slug === slug);
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
  getUsers: () => wait(adminUsers),
  getResolutionQueue: () => wait(resolutions),
  getTransactions: () => wait(transactions.map((transaction, index) => ({
    ...transaction,
    createdAt: new Date(Date.UTC(2026, 7, 4, 12, -index * 7)).toISOString()
  }))),
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
    const labels = input.outcomes.map((label) => label.trim()).filter(Boolean);
    if (labels.length < 2 || new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
      return wait({ id: "market-invalid", status: "rejected", message: "Markets require at least two unique outcomes." });
    }
    const endDate = new Date(input.endDate);
    if (!Number.isFinite(endDate.getTime())) return wait({ id: "market-invalid", status: "rejected", message: "Close date is invalid." });

    const id = `market-${Date.now()}`;
    const baseProbability = Math.floor(100 / labels.length);
    const remainder = 100 - baseProbability * labels.length;
    const market: Market = {
      id,
      slug: `${slugify(input.question)}-${Date.now().toString().slice(-5)}`,
      question: input.question.trim(),
      shortQuestion: input.question.trim(),
      description: input.resolutionRules.trim(),
      category: input.category,
      tags: [input.category],
      kind: input.kind,
      status: "draft",
      imageTone: "tone-green",
      icon: "◎",
      outcomes: labels.map((label, index) => ({
        id: `${id}-outcome-${index + 1}`,
        label,
        probability: baseProbability + (index < remainder ? 1 : 0),
        change24h: 0,
        volume24h: 0
      })),
      volume: 0,
      volume24h: 0,
      liquidity: 0,
      traders: 0,
      commentCount: 0,
      endDate: endDate.toISOString(),
      createdAt: new Date().toISOString(),
      resolutionSource: input.resolutionSource.trim(),
      resolutionRules: input.resolutionRules.trim(),
      chart: [50, 50, 50, 50]
    };
    markets.unshift(market);
    return wait({ id, status: "accepted", message: "Market draft created." });
  },
  updateMarketStatus: (marketId, status) => {
    const market = markets.find((item) => item.id === marketId);
    if (!market) return wait({ id: marketId, status: "rejected", message: "Market was not found." });
    if (market.status === "resolved") return wait({ id: marketId, status: "rejected", message: "Resolved markets cannot be reopened or paused." });
    if (status !== "open" && status !== "paused") return wait({ id: marketId, status: "rejected", message: "Unsupported market status transition." });
    market.status = status;
    return wait({ id: marketId, status: "accepted", message: `Market status changed to ${status}.` });
  },
  updateUserStatus: (userId, status) => {
    const user = adminUsers.find((item) => item.id === userId);
    if (!user) return wait({ id: userId, status: "rejected", message: "User was not found." });
    user.status = status;
    return wait({ id: userId, status: "accepted", message: `User status changed to ${status}.` });
  },
  resolveMarket: (caseId, outcome) => {
    const resolution = resolutions.find((item) => item.id === caseId);
    if (!resolution) return wait({ id: caseId, status: "rejected", message: "Resolution case was not found." });
    if (resolution.status === "approved") return wait({ id: caseId, status: "rejected", message: "Resolution case is already approved." });
    resolution.status = "approved";
    resolution.proposedOutcome = outcome;
    return wait({ id: caseId, status: "accepted", message: `Resolution prepared for ${outcome}.` });
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
