import { expect, test } from "bun:test";
import { mockAdapter } from "./index";

test("mock adapter exposes market, trading, account and crypto funding contracts", async () => {
  const markets = await mockAdapter.listMarkets();
  expect(markets.length).toBeGreaterThan(0);
  expect(markets.some((market) => market.status === "resolved")).toBe(true);

  const market = await mockAdapter.getMarket(markets[0].slug);
  expect(market?.id).toBe(markets[0].id);

  const preview = await mockAdapter.previewOrder({
    clientRequestId: "test-order",
    marketId: markets[0].id,
    outcomeId: markets[0].outcomes[0].id,
    side: "buy",
    type: "market",
    collateralAmount: 100
  });
  expect(preview.estimatedShares).toBeGreaterThan(0);

  const cancelled = await mockAdapter.cancelOrder("ord-1");
  expect(cancelled.status).toBe("accepted");

  const resolved = (await mockAdapter.getPositions()).find((position) => position.status === "resolved");
  expect(resolved?.claimableAmount).toBeGreaterThan(0);
  const redemption = await mockAdapter.redeemPosition(resolved?.id ?? "missing");
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
