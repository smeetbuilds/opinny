import { expect, test } from "bun:test";
import { markets } from "./data";

test("curated paper markets have unique routes, meaningful resolution rules and coherent quotes", () => {
  const ids = markets.map((market) => market.id);
  const slugs = markets.map((market) => market.slug);
  expect(new Set(ids).size).toBe(markets.length);
  expect(new Set(slugs).size).toBe(markets.length);
  expect(markets.length).toBeGreaterThanOrEqual(16);
  for (const market of markets) {
    expect(market.question.length).toBeGreaterThan(15);
    expect(market.resolutionSource.trim().length).toBeGreaterThan(4);
    expect(market.resolutionRules.trim().length).toBeGreaterThan(20);
    expect(new Date(market.endDate).getTime()).toBeGreaterThan(new Date(market.createdAt).getTime());
    expect(market.outcomes.length).toBeGreaterThanOrEqual(2);
    expect(new Set(market.outcomes.map((outcome) => outcome.id)).size).toBe(market.outcomes.length);
    expect(new Set(market.outcomes.map((outcome) => outcome.label)).size).toBe(market.outcomes.length);
    expect(market.outcomes.reduce((sum, outcome) => sum + outcome.probability, 0)).toBeCloseTo(100, 4);
    expect(market.outcomes.every((outcome) => outcome.probability >= 0 && outcome.probability <= 100)).toBe(true);
    expect(market.chart.length).toBeGreaterThanOrEqual(4);
    expect(market.chart.every((point) => Number.isFinite(point) && point >= 0 && point <= 100)).toBe(true);
    expect(market.liquidity).toBeGreaterThanOrEqual(0);
    expect(market.volume24h).toBeGreaterThanOrEqual(0);
  }
});
