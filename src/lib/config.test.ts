import { expect, test } from "bun:test";
import { appConfig, normalizeChainId } from "./config";

test("platform configuration preserves frontend product requirements", () => {
  expect(appConfig.name).toBe("Opinny");
  expect(appConfig.cryptoOnly).toBe(true);
  expect(appConfig.lightModeOnly).toBe(true);
  expect(appConfig.supportedAssets.length).toBeGreaterThan(0);
  expect(appConfig.features.adminConsole).toBe(true);
  expect(appConfig.features.cryptoFunding).toBe(true);
});

test("chain configuration accepts only positive safe integers", () => {
  expect(normalizeChainId("137")).toBe(137);
  expect(normalizeChainId("0")).toBe(137);
  expect(normalizeChainId("-1")).toBe(137);
  expect(normalizeChainId("1.5")).toBe(137);
  expect(normalizeChainId("not-a-number")).toBe(137);
  expect(normalizeChainId(Number.MAX_SAFE_INTEGER + 1)).toBe(137);
});
