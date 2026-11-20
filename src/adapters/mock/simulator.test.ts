import { expect, test } from "bun:test";
import {
  cancelPaperOrder,
  createPaperMarket,
  executePaperOrder,
  matchPaperOrder,
  paperActivity,
  paperAdminUsers,
  paperBalances,
  paperJournal,
  paperMarkets,
  paperResolutionCases,
  paperOrders,
  paperOrderBook,
  paperPositions,
  paperTransactions,
  previewPaperOrder,
  redeemPaperPosition,
  seedPaperExchangeForTests,
  setPaperMarketStatus,
  setPaperResolution,
  setPaperUserStatus,
  settlePaperFunding,
  settlePaperMarket
} from "./simulator";

test("paper exchange conserves collateral and tracks orders, fills, positions, and funding", () => {
  seedPaperExchangeForTests();
  const balance = () => paperBalances().find((item) => item.asset === "USDC")!;
  const start = balance().available;
  const originalShares = paperPositions().find((position) => position.marketId === "mkt-001" && position.outcome === "Yes")!.shares;

  const buy = {
    clientRequestId: "paper-test-buy",
    marketId: "mkt-001",
    outcomeId: "yes",
    side: "buy" as const,
    type: "market" as const,
    collateralAmount: 100
  };
  const preview = previewPaperOrder(buy);
  expect(preview.estimatedShares).toBeGreaterThan(150);
  expect(preview.estimatedCollateral + preview.estimatedFee).toBeLessThanOrEqual(100.00001);
  const beforeDepth = preview.estimatedPrice;
  expect(beforeDepth).toBeGreaterThan(0.63);
  expect(executePaperOrder(buy)).toContain("filled");
  expect(paperJournal().some((entry) => entry.kind === "fill" && entry.fee > 0)).toBe(true);
  expect(balance().available).toBeLessThan(start);
  expect(paperPositions().find((position) => position.marketId === "mkt-001" && position.outcome === "Yes")!.shares).toBeGreaterThan(originalShares);
  const afterBuy = balance().available;
  expect(executePaperOrder(buy)).toContain("already");
  expect(balance().available).toBe(afterBuy);

  const sell = {
    clientRequestId: "paper-test-sell",
    marketId: "mkt-001",
    outcomeId: "yes",
    side: "sell" as const,
    type: "market" as const,
    shares: 10
  };
  executePaperOrder(sell);
  expect(balance().available).toBeGreaterThan(afterBuy);

  const resting = {
    clientRequestId: "paper-test-limit",
    marketId: "mkt-001",
    outcomeId: "yes",
    side: "buy" as const,
    type: "limit" as const,
    collateralAmount: 50,
    limitPrice: 0.25
  };
  const beforeLimit = balance().available;
  expect(executePaperOrder(resting)).toContain("posted");
  expect(balance().available).toBeCloseTo(beforeLimit - 50, 4);
  expect(balance().locked).toBeGreaterThan(50);
  expect(paperOrders().find((order) => order.id === resting.clientRequestId)!.status).toBe("open");
  expect(matchPaperOrder(resting.clientRequestId)).toContain("50%");
  expect(paperOrders().find((order) => order.id === resting.clientRequestId)!.status).toBe("partially-filled");
  expect(matchPaperOrder(resting.clientRequestId)).toContain("fully matched");
  expect(paperOrders().find((order) => order.id === resting.clientRequestId)!.status).toBe("filled");
  expect(() => cancelPaperOrder(resting.clientRequestId)).toThrow();

  const second = { ...resting, clientRequestId: "paper-test-limit-cancel" };
  const beforeSecond = balance().available;
  executePaperOrder(second);
  expect(cancelPaperOrder(second.clientRequestId)).toContain("released");
  expect(balance().available).toBeCloseTo(beforeSecond, 4);
  expect(paperOrders().find((order) => order.id === second.clientRequestId)!.status).toBe("cancelled");

  const beforeFunding = balance().available;
  const deposit = { type: "deposit" as const, asset: "USDC", amount: 200, chainId: 137 };
  settlePaperFunding(deposit, "fund-test-1");
  settlePaperFunding(deposit, "fund-test-1");
  expect(balance().available).toBeCloseTo(beforeFunding + 200, 4);
  settlePaperFunding({ type: "withdrawal", asset: "USDC", amount: 50, chainId: 137, destination: "0x1111111111111111111111111111111111111111" }, "fund-test-2");
  expect(balance().available).toBeCloseTo(beforeFunding + 150, 4);
  expect(() => settlePaperFunding({ ...deposit, amount: -2 }, "fund-test-invalid")).toThrow();

  const beforeRedemption = balance().available;
  redeemPaperPosition("pos-5");
  expect(balance().available).toBeCloseTo(beforeRedemption + 486, 4);
  expect(paperPositions().find((position) => position.id === "pos-5")!.status).toBe("claimed");
  expect(() => redeemPaperPosition("pos-5")).toThrow();
  expect(paperActivity().some((item) => item.title === "Winning position redeemed")).toBe(true);
  expect(paperTransactions().filter((tx) => tx.id.startsWith("paper-tx-")).length).toBeGreaterThanOrEqual(4);
  expect(paperTransactions().some((tx) => tx.type === "deposit" && tx.amount === 200)).toBe(true);
});

test("paper engine rejects invalid price, insufficient collateral and unowned shares", () => {
  seedPaperExchangeForTests();
  expect(() => previewPaperOrder({
    clientRequestId: "bad", marketId: "mkt-001", outcomeId: "yes",
    side: "buy", type: "limit", limitPrice: 1, collateralAmount: 100
  })).toThrow();
  expect(() => previewPaperOrder({
    clientRequestId: "bad2", marketId: "mkt-001", outcomeId: "yes",
    side: "buy", type: "market", collateralAmount: 999999
  })).toThrow();
  expect(() => previewPaperOrder({
    clientRequestId: "bad3", marketId: "mkt-001", outcomeId: "no",
    side: "sell", type: "market", shares: 100
  })).toThrow();
  expect(() => previewPaperOrder({
    clientRequestId: "bad4", marketId: "mkt-009", outcomeId: "yes",
    side: "buy", type: "market", collateralAmount: 10
  })).toThrow();
});

test("admin sandbox decisions persist in paper account and gate trading", () => {
  seedPaperExchangeForTests();
  expect(paperMarkets().find((market) => market.id === "mkt-001")!.status).toBe("open");
  setPaperMarketStatus("mkt-001", "paused");
  expect(paperMarkets().find((market) => market.id === "mkt-001")!.status).toBe("paused");
  expect(() => previewPaperOrder({
    clientRequestId: "paused-test", marketId: "mkt-001", outcomeId: "yes",
    side: "buy", type: "market", collateralAmount: 10
  })).toThrow();
  setPaperMarketStatus("mkt-001", "open");
  expect(paperMarkets().find((market) => market.id === "mkt-001")!.status).toBe("open");

  const id = createPaperMarket({
    question: "Will the sample event happen next year?",
    category: "Science", kind: "binary", outcomes: ["Yes", "No"],
    endDate: new Date(Date.now() + 400 * 86_400_000).toISOString(),
    resolutionSource: "Sample source", resolutionRules: "Resolves based on the sample source."
  });
  expect(paperMarkets().find((market) => market.id === id)?.status).toBe("draft");
  expect(setPaperMarketStatus(id, "open")).toContain("open");
  expect(paperMarkets().find((market) => market.id === id)?.status).toBe("open");

  setPaperUserStatus("usr-1001", "review");
  expect(paperAdminUsers().find((user) => user.id === "usr-1001")?.status).toBe("review");

  expect(paperResolutionCases().find((item) => item.id === "res-201")!.status).toBe("proposed");
  setPaperResolution("res-201", "Yes");
  expect(paperResolutionCases().find((item) => item.id === "res-201")!.status).toBe("approved");
  expect(() => setPaperResolution("res-201", "Yes")).toThrow();
  const settled = paperMarkets().find((market) => market.id === "mkt-001");
  if (settled?.status === "resolved") {
    expect(settled.outcomes.find((outcome) => outcome.label === "Yes")?.probability).toBe(100);
    expect(settled.outcomes.filter((outcome) => outcome.label !== "Yes").every((outcome) => outcome.probability === 0)).toBe(true);
  }
});


test("paper market fills consume only finite displayed synthetic liquidity", () => {
  seedPaperExchangeForTests();
  const before = paperOrderBook("mkt-001", "yes");
  const best = before.asks[0];
  const intent = { clientRequestId: "depth-fill-test", marketId: "mkt-001", outcomeId: "yes", side: "buy" as const, type: "market" as const, collateralAmount: 100 };
  const estimate = previewPaperOrder(intent);
  expect(estimate.priceImpactBps).toBe(0);
  const larger = previewPaperOrder({ ...intent, clientRequestId: "depth-multiple-levels", collateralAmount: 1000 });
  expect(larger.priceImpactBps).toBeGreaterThan(0);
  // The default 1% warning must not reject a small order merely for crossing the spread.
  expect(previewPaperOrder({ ...intent, maxSlippageBps: 100 }).estimatedShares).toBeGreaterThan(0);
  executePaperOrder(intent);
  const after = paperOrderBook("mkt-001", "yes");
  expect(after.asks.find((level) => level.price === best.price)!.size).toBeLessThan(best.size);
  expect(paperMarkets().find((market) => market.id === "mkt-001")!.outcomes.find((outcome) => outcome.id === "yes")!.probability).toBeGreaterThan(63);
  expect(paperJournal().filter((entry) => entry.kind === "fill").length).toBeGreaterThan(0);
  expect(() => previewPaperOrder({ ...intent, clientRequestId: "too-large", collateralAmount: 200_000 })).toThrow();
});

test("paper market orders respect visible depth and slippage guards", () => {
  seedPaperExchangeForTests();
  expect(() => previewPaperOrder({ clientRequestId: "slippage", marketId: "mkt-001", outcomeId: "yes", side: "buy", type: "market", collateralAmount: 1000, maxSlippageBps: 10 })).toThrow();
  const positionsBefore = paperPositions().find((position) => position.marketId === "mkt-001" && position.outcome === "Yes")!.shares;
  const sold = previewPaperOrder({ clientRequestId: "sell-depth", marketId: "mkt-001", outcomeId: "yes", side: "sell", type: "market", shares: 10 });
  expect(sold.estimatedPrice).toBeLessThan(0.63);
  executePaperOrder({ clientRequestId: "sell-depth", marketId: "mkt-001", outcomeId: "yes", side: "sell", type: "market", shares: 10 });
  expect(paperPositions().find((position) => position.marketId === "mkt-001" && position.outcome === "Yes")!.shares).toBe(positionsBefore - 10);
});


test("paper reserve journal reconciles available and locked balances through partial fills", () => {
  seedPaperExchangeForTests();
  const start = paperBalances().find((row) => row.asset === "USDC")!;
  const request = { clientRequestId: "journal-limit-test", marketId: "mkt-001", outcomeId: "yes", side: "buy" as const, type: "limit" as const, collateralAmount: 40, limitPrice: 0.25 };
  executePaperOrder(request);
  const afterPost = paperBalances().find((row) => row.asset === "USDC")!;
  const journalAfterPost = paperJournal();
  expect(afterPost.available).toBeCloseTo(start.available - 40, 4);
  expect(journalAfterPost.some((row) => row.kind === "reserve")).toBe(true);
  matchPaperOrder(request.clientRequestId);
  const afterFill = paperBalances().find((row) => row.asset === "USDC")!;
  expect(afterFill.available).toBeCloseTo(afterPost.available, 4);
  expect(afterFill.locked).toBeLessThan(afterPost.locked);
  const deltaAvailable = paperJournal().reduce((sum, row) => sum + (row.asset === "USDC" ? row.cashDelta : 0), 0);
  const deltaLocked = paperJournal().reduce((sum, row) => sum + (row.asset === "USDC" ? row.lockedDelta : 0), 0);
  expect(afterFill.available - start.available).toBeCloseTo(deltaAvailable, 4);
  expect(afterFill.locked - start.locked).toBeCloseTo(deltaLocked, 4);
});

test("paper request IDs reject conflicting replay without changing account state", () => {
  seedPaperExchangeForTests();
  const intent = {
    clientRequestId: "idempotent-order", marketId: "mkt-001", outcomeId: "yes",
    side: "buy" as const, type: "market" as const, collateralAmount: 24
  };
  executePaperOrder(intent);
  const snapshot = {
    available: paperBalances().find((item) => item.asset === "USDC")!.available,
    shares: paperPositions().find((item) => item.marketId === "mkt-001" && item.outcome === "Yes")!.shares,
    trades: paperTransactions().length
  };
  expect(executePaperOrder(intent)).toContain("already");
  expect(() => executePaperOrder({ ...intent, collateralAmount: 65 })).toThrow("different trade");
  expect(() => executePaperOrder({ ...intent, outcomeId: "no" })).toThrow("different trade");
  expect(paperBalances().find((item) => item.asset === "USDC")!.available).toBe(snapshot.available);
  expect(paperPositions().find((item) => item.marketId === "mkt-001" && item.outcome === "Yes")!.shares).toBe(snapshot.shares);
  expect(paperTransactions().length).toBe(snapshot.trades);
});

test("crossing buy limits charge actual fill price, not the more expensive limit", () => {
  seedPaperExchangeForTests();
  const before = paperBalances().find((item) => item.asset === "USDC")!;
  const intent = {
    clientRequestId: "better-price", marketId: "mkt-001", outcomeId: "yes",
    side: "buy" as const, type: "limit" as const, collateralAmount: 100, limitPrice: 0.70
  };
  const quote = previewPaperOrder(intent);
  expect(quote.estimatedPrice).toBeLessThan(intent.limitPrice);
  expect(quote.estimatedCollateral + quote.estimatedFee).toBeLessThan(100);
  executePaperOrder(intent);
  const after = paperBalances().find((item) => item.asset === "USDC")!;
  expect(before.available - after.available).toBeCloseTo(quote.estimatedCollateral + quote.estimatedFee, 4);
  const order = paperOrders().find((item) => item.id === intent.clientRequestId)!;
  expect(order.status).toBe("filled");
  expect(order.price).toBe(intent.limitPrice);
  expect(after.locked).toBe(before.locked);
});

test("settlement cancels resting orders, releases collateral and pays winners once", () => {
  seedPaperExchangeForTests();
  const resting = {
    clientRequestId: "settlement-resting", marketId: "mkt-001", outcomeId: "yes",
    side: "buy" as const, type: "limit" as const, collateralAmount: 70, limitPrice: 0.20
  };
  const before = paperBalances().find((item) => item.asset === "USDC")!;
  executePaperOrder(resting);
  const placed = paperBalances().find((item) => item.asset === "USDC")!;
  expect(placed.available).toBeCloseTo(before.available - 70, 4);
  expect(placed.locked).toBeGreaterThan(before.locked);
  const position = paperPositions().find((item) => item.marketId === "mkt-001" && item.outcome === "Yes")!;
  const winnerShares = position.shares;
  settlePaperMarket("mkt-001", "Yes");
  expect(paperMarkets().find((item) => item.id === "mkt-001")?.status).toBe("resolved");
  expect(paperOrders().find((item) => item.id === resting.clientRequestId)?.status).toBe("cancelled");
  const settled = paperBalances().find((item) => item.asset === "USDC")!;
  expect(settled.available).toBeCloseTo(before.available, 4);
  expect(settled.locked).toBeCloseTo(before.locked, 4);
  const resolved = paperPositions().find((item) => item.id === position.id)!;
  expect(resolved.claimableAmount).toBeCloseTo(winnerShares, 4);
  redeemPaperPosition(position.id);
  expect(paperBalances().find((item) => item.asset === "USDC")!.available).toBeCloseTo(before.available + winnerShares, 4);
  expect(() => redeemPaperPosition(position.id)).toThrow();
  expect(() => previewPaperOrder({ ...resting, clientRequestId: "after-settle" })).toThrow();
});

test("created paper market supports publish, trade, outcome selection, settlement and one-time redemption", () => {
  seedPaperExchangeForTests();
  const id = createPaperMarket({
    question: "Will the paper scenario finish with the second result?",
    category: "Science", kind: "binary", outcomes: ["First", "Second"],
    endDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    resolutionSource: "Scenario fixture", resolutionRules: "Choose a winning outcome from the browser-local admin queue."
  });
  expect(paperResolutionCases().some((item) => item.marketId === id)).toBe(false);
  setPaperMarketStatus(id, "open");
  const market = paperMarkets().find((item) => item.id === id)!;
  const resolutionCase = paperResolutionCases().find((item) => item.marketId === id)!;
  expect(resolutionCase.status).toBe("awaiting");
  const initialCash = paperBalances().find((item) => item.asset === "USDC")!.available;
  executePaperOrder({
    clientRequestId: "scenario-buy", marketId: id, outcomeId: market.outcomes[1].id,
    side: "buy", type: "market", collateralAmount: 40
  });
  const won = paperPositions().find((position) => position.marketId === id && position.outcome === "Second")!;
  expect(won.shares).toBeGreaterThan(0);
  expect(paperBalances().find((item) => item.asset === "USDC")!.available).toBeLessThan(initialCash);
  setPaperResolution(resolutionCase.id, "Second");
  expect(paperResolutionCases().find((item) => item.id === resolutionCase.id)?.status).toBe("approved");
  expect(paperMarkets().find((item) => item.id === id)!.outcomes.find((item) => item.label === "Second")!.probability).toBe(100);
  const claimable = paperPositions().find((item) => item.id === won.id)!;
  expect(claimable.status).toBe("resolved");
  expect(claimable.claimableAmount).toBeCloseTo(won.shares, 4);
  redeemPaperPosition(won.id);
  expect(paperBalances().find((item) => item.asset === "USDC")!.available).toBeGreaterThan(initialCash);
  expect(() => redeemPaperPosition(won.id)).toThrow();
  expect(() => setPaperResolution(resolutionCase.id, "First")).toThrow();
});

test("resting sell orders reserve shares without prematurely debiting the portfolio", () => {
  seedPaperExchangeForTests();
  const shares = paperPositions().find((item) => item.marketId === "mkt-001" && item.outcome === "Yes")!.shares;
  const before = paperBalances().find((item) => item.asset === "USDC")!.available;
  executePaperOrder({
    clientRequestId: "sell-reserve-all", marketId: "mkt-001", outcomeId: "yes",
    side: "sell", type: "limit", shares, limitPrice: 0.99
  });
  expect(paperOrders().find((item) => item.id === "sell-reserve-all")?.status).toBe("open");
  expect(paperPositions().find((item) => item.marketId === "mkt-001" && item.outcome === "Yes")?.shares).toBe(shares);
  expect(paperBalances().find((item) => item.asset === "USDC")!.available).toBe(before);
  expect(() => previewPaperOrder({
    clientRequestId: "oversell", marketId: "mkt-001", outcomeId: "yes",
    side: "sell", type: "market", shares: 1
  })).toThrow();
  cancelPaperOrder("sell-reserve-all");
  expect(previewPaperOrder({
    clientRequestId: "shares-released", marketId: "mkt-001", outcomeId: "yes",
    side: "sell", type: "market", shares: 1
  }).estimatedShares).toBe(1);
  expect(paperBalances().find((item) => item.asset === "USDC")!.available).toBe(before);
});

test("each multi-outcome paper fill keeps probabilities normalised", () => {
  seedPaperExchangeForTests();
  const initial = paperMarkets().find((item) => item.id === "mkt-003")!;
  expect(initial.outcomes.reduce((total, item) => total + item.probability, 0)).toBe(100);
  executePaperOrder({
    clientRequestId: "four-outcome-normalisation", marketId: "mkt-003",
    outcomeId: "two", side: "buy", type: "market", collateralAmount: 45
  });
  const updated = paperMarkets().find((item) => item.id === "mkt-003")!;
  expect(updated.outcomes.reduce((total, item) => total + item.probability, 0)).toBeCloseTo(100, 4);
  expect(updated.outcomes.every((item) => item.probability >= 0 && item.probability <= 100)).toBe(true);
  expect(updated.chart.at(-1)).toBeCloseTo(updated.outcomes[0].probability, 4);
});

test("every bundled market resolves through a linked paper-admin case", () => {
  seedPaperExchangeForTests();
  const cases = paperResolutionCases();
  const available = paperMarkets();
  for (const market of available) {
    const linked = cases.filter((item) => item.marketId === market.id);
    expect(linked.length).toBe(1);
    expect(linked[0].source).toBe(market.resolutionSource);
    expect(market.outcomes.some((item) => item.label === linked[0].proposedOutcome)).toBe(true);
  }
  const sample = cases.find((item) => item.marketId === "mkt-003")!;
  const before = paperPositions().find((item) => item.marketId === "mkt-003" && item.outcome === "2 cuts")!;
  expect(sample.status).toBe("awaiting");
  setPaperResolution(sample.id, "2 cuts");
  expect(paperResolutionCases().find((item) => item.id === sample.id)?.status).toBe("approved");
  expect(paperMarkets().find((item) => item.id === "mkt-003")?.status).toBe("resolved");
  const winning = paperPositions().find((item) => item.id === before.id)!;
  expect(winning.claimableAmount).toBeCloseTo(before.shares, 4);
  const cashBefore = paperBalances().find((item) => item.asset === "USDC")!.available;
  redeemPaperPosition(before.id);
  expect(paperBalances().find((item) => item.asset === "USDC")!.available).toBeCloseTo(cashBefore + before.shares, 4);
});

test("resolved books are empty and matched paper depth reduces displayed liquidity", () => {
  seedPaperExchangeForTests();
  expect(paperOrderBook("mkt-009", "yes").asks.length).toBe(0);
  expect(paperOrderBook("mkt-009", "yes").bids.length).toBe(0);
  const before = paperMarkets().find((item) => item.id === "mkt-001")!;
  const beforeBook = paperOrderBook("mkt-001", "yes");
  executePaperOrder({
    clientRequestId: "liquidity-consumption-test", marketId: "mkt-001",
    outcomeId: "yes", side: "buy", type: "market", collateralAmount: 80
  });
  const after = paperMarkets().find((item) => item.id === "mkt-001")!;
  const afterBook = paperOrderBook("mkt-001", "yes");
  expect(after.liquidity).toBeLessThan(before.liquidity);
  expect(after.volume).toBeGreaterThan(before.volume);
  expect(afterBook.asks[0].size).toBeLessThan(beforeBook.asks[0].size);
  settlePaperMarket("mkt-001", "Yes");
  expect(paperOrderBook("mkt-001", "yes").asks.length).toBe(0);
  expect(paperOrderBook("mkt-001", "yes").bids.length).toBe(0);
});
