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
  settlePaperFunding
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
