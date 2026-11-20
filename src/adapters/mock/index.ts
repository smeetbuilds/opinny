import type { AdminAnalytics, AdminMetric, Market, MarketComment, RewardOpportunity } from "@/core/contracts/domain";
import type { MarketQuery, OpinnyIntegrationAdapter } from "@/core/contracts/ports";
import { appConfig } from "@/lib/config";
import { addPaperComment, cancelPaperOrder, createPaperMarket, executePaperOrder, matchPaperOrder, paperActivity, paperAdminUsers, paperAllTrades, paperBalances, paperComments, paperMarkets, paperOrderBook, paperOrders, paperPositions, paperResolutionCases, paperRewardEarnings, paperTrades, paperTransactions, previewPaperOrder, paperReplyCount, paperUseful, redeemPaperPosition, resetPaperExchange, setPaperMarketStatus, setPaperResolution, setPaperUserStatus, setPaperUseful, settlePaperFunding } from "./simulator";
import {
  leaderboard,
  markets,
  recentTrades,
} from "./data";

const wait = <T,>(value: T) => Promise.resolve(value);
const referenceContract = "0x0000000000000000000000000000000000000001";

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
    commentCount: comments.length + comments.reduce((sum, comment) => sum + comment.replyCount, 0) + paperComments(market.id).length
  };
}

function buildRewardOpportunities(): RewardOpportunity[] {
  return paperMarkets().filter((market) => market.status === "open").slice(0, 12).map((market, index) => {
    const maxSpreadCents = 3 + (index % 3);
    const minimumShares = 20 + (index % 4) * 10;
    const resting = paperOrders().filter((order) =>
      order.marketSlug === market.slug && order.type === "limit" && ["open", "partially-filled"].includes(order.status)
      && order.shares - order.filled >= minimumShares
      && market.outcomes.some((outcome) => outcome.label === order.outcome && Math.abs(order.price - outcome.probability / 100) * 100 <= maxSpreadCents));
    const book = paperOrderBook(market.id, market.outcomes[0].id);
    const visibleSize = [...book.bids, ...book.asks].reduce((sum, level) => sum + level.size, 0);
    const ownSize = resting.reduce((sum, order) => sum + order.shares - order.filled, 0);
    return {
      id: "reward-" + market.id, marketId: market.id, marketSlug: market.slug,
      marketQuestion: market.shortQuestion, category: market.category,
      maxSpreadCents, minimumShares, dailyReward: 40 + (index % 5) * 20,
      competitionPercent: visibleSize ? Math.max(0, Math.min(100, Math.round(100 * (1 - ownSize / visibleSize)))) : 0,
      earned: paperRewardEarnings(market.id), eligible: resting.length > 0,
      outcomePrices: market.outcomes.slice(0, 3).map((outcome) => ({ label: outcome.label, price: outcome.probability / 100 }))
    };
  });
}

/** Local fills only: seeded display volume is deliberately excluded from operational reporting. */
function buildPaperAnalytics(): AdminAnalytics {
  const latest = paperAllTrades();
  const days = Array.from({ length: 30 }, (_, offset) => {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - (29 - offset));
    return day.toISOString().slice(0, 10);
  });
  const volumeSeries = days.map((day) => Math.round(latest.filter((trade) => trade.createdAt?.slice(0, 10) === day).reduce((sum, trade) => sum + trade.value, 0)));
  const volumeTotal = latest.filter((trade) => trade.createdAt && days.includes(trade.createdAt.slice(0, 10))).reduce((sum, trade) => sum + trade.value, 0);
  const totals = new Map<string, number>();
  const marketsById = new Map(paperMarkets().map((market) => [market.id, market]));
  for (const trade of latest) {
    const category = marketsById.get(trade.marketId)?.category ?? "Other";
    totals.set(category, (totals.get(category) ?? 0) + trade.value);
  }
  const allVolume = [...totals.values()].reduce((sum, value) => sum + value, 0);
  let assigned = 0;
  const categories = [...totals].map(([label, value], index, entries) => {
    const percent = index === entries.length - 1 ? 100 - assigned : allVolume ? Math.round(value * 100 / allVolume) : 0;
    assigned += percent;
    return { label, value: percent };
  });
  const allMarkets = paperMarkets();
  const due = allMarkets.filter((market) => market.status === "resolved" || Date.parse(market.endDate) <= Date.now());
  const resolved = due.filter((market) => market.status === "resolved").length;
  return {
    volumeSeries, volumeTotal, dailyAverage: volumeTotal / 30, peakDay: Math.max(0, ...volumeSeries),
    settlementRate: due.length ? Math.round(resolved / due.length * 1000) / 10 : 0,
    categoryTotal: allVolume, categories
  };
}
function buildPaperMetrics(): AdminMetric[] {
  const analytics = buildPaperAnalytics();
  const allMarkets = paperMarkets();
  return [
    { label: "Paper volume (30d)", value: "$" + Math.round(analytics.volumeTotal).toLocaleString(), change: 0, hint: "Your browser-local matched trades" },
    { label: "Open markets", value: allMarkets.filter((market) => market.status === "open").length.toLocaleString(), change: 0, hint: "Includes sample markets" },
    { label: "Paper fills", value: paperAllTrades().length.toLocaleString(), change: 0, hint: "Simulated counterparty trades" },
    { label: "Settlement rate", value: analytics.settlementRate + "%", change: 0, hint: "Resolved among closed sample markets" }
  ];
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
    const marketIndex = markets.findIndex((item) => item.id === marketId);
    const market = markets[marketIndex];
    // Fixed, explicitly labelled sample prints are distinct from trades generated by this browser.
    const reference = market ? recentTrades.map((trade, index) => {
      const outcome = market.outcomes[(index + marketIndex) % market.outcomes.length];
      const price = outcome.probability / 100;
      const shares = Math.round(trade.shares * (0.7 + ((marketIndex + index) % 5) * 0.13));
      return {
        ...trade, id: marketId + "-" + trade.id, outcome: outcome.label,
        price, shares, value: Math.round(shares * price * 100) / 100,
        time: ["Sample · 2h", "Sample · 3h", "Sample · 5h", "Sample · 8h"][index % 4]
      };
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
  getMetrics: () => wait(buildPaperMetrics()),
  getAnalytics: () => wait(buildPaperAnalytics()),


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
      return wait({ id, status: "accepted" as const, message: "Local market draft saved. Publish it from the admin market list; it is visible only in this browser." });
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
