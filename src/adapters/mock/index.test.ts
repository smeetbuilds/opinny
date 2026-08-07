import { expect, test } from "bun:test";
import { mockAdapter } from "./index";

test("mock adapter exposes market, rewards, discussion, trading, account and crypto funding contracts", async () => {
  const markets = await mockAdapter.listMarkets();
  expect(markets.length).toBeGreaterThan(0);
  expect(markets.some((market) => market.status === "resolved")).toBe(true);

  const byLiquidity = await mockAdapter.listMarkets({ sort: "liquidity" });
  expect(byLiquidity[0].liquidity).toBeGreaterThanOrEqual(byLiquidity.at(-1)?.liquidity ?? 0);

  const market = await mockAdapter.getMarket(markets[0].slug);
  expect(market?.id).toBe(markets[0].id);

  const comments = await mockAdapter.getMarketComments(markets[0].id);
  expect(comments.length).toBeGreaterThan(0);
  const comment = await mockAdapter.createMarketComment({
    marketId: markets[0].id,
    body: "Test discussion comment"
  });
  expect(comment.marketId).toBe(markets[0].id);
  expect(comment.body).toBe("Test discussion comment");

  const rewards = await mockAdapter.getRewardOpportunities();
  expect(rewards.length).toBeGreaterThan(0);
  expect(rewards.every((reward) => reward.dailyReward > 0)).toBe(true);

  const preview = await mockAdapter.previewOrder({
    clientRequestId: "test-order",
    marketId: markets[0].id,
    outcomeId: markets[0].outcomes[0].id,
    side: "buy",
    type: "market",
    collateralAmount: 100
  });
  expect(preview.estimatedShares).toBeGreaterThan(0);

  const cancellation = await mockAdapter.cancelOrder("ord-1");
  expect(cancellation.status).toBe("accepted");

  const positions = await mockAdapter.getPositions();
  const claimable = positions.find((position) => position.status === "resolved" && (position.claimableAmount ?? 0) > 0);
  expect(claimable).toBeDefined();
  const redemption = await mockAdapter.redeemPosition(claimable!.id);
  expect(redemption.status).toBe("accepted");

  const funding = await mockAdapter.prepareFunding({
    type: "deposit",
    asset: "USDC",
    amount: 100,
    chainId: 137
  });
  expect(funding.walletRequest.chainId).toBe(137);
  expect(funding.requestId.startsWith("fund-")).toBe(true);
});
