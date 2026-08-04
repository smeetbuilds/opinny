import { describe, expect, test } from "bun:test";
import { mockAdapter } from "./index";

const demoIntent = {
  clientRequestId: "test-order-1",
  marketId: "mkt-001",
  outcomeId: "yes",
  side: "buy" as const,
  type: "market" as const,
  collateralAmount: 100
};

describe("mockAdapter", () => {
  test("returns markets sorted by daily volume", async () => {
    const result = await mockAdapter.listMarkets({ sort: "trending" });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].volume24h).toBeGreaterThanOrEqual(result[1].volume24h);
  });

  test("filters markets by category and search term", async () => {
    const result = await mockAdapter.listMarkets({ category: "Crypto", search: "Bitcoin" });
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Crypto");
  });

  test("returns account and admin demo states", async () => {
    const [positions, metrics, resolutions] = await Promise.all([
      mockAdapter.getPositions(),
      mockAdapter.getMetrics(),
      mockAdapter.getResolutionQueue()
    ]);
    expect(positions.length).toBeGreaterThan(0);
    expect(metrics).toHaveLength(4);
    expect(resolutions.some((item) => item.status === "disputed")).toBe(true);
  });

  test("previews and prepares backend-neutral order commands", async () => {
    const preview = await mockAdapter.previewOrder(demoIntent);
    const prepared = await mockAdapter.prepareOrder(demoIntent);
    expect(preview.estimatedShares).toBeGreaterThan(0);
    expect(prepared.requestId).toBe(demoIntent.clientRequestId);
    expect(prepared.walletRequest?.chainId).toBe(137);
  });

  test("emits an initial real-time snapshot", async () => {
    const event = await new Promise<{ type: string }>((resolve) => {
      mockAdapter.subscribeToMarket("mkt-001", resolve);
    });
    expect(event.type).toBe("snapshot");
  });
});
