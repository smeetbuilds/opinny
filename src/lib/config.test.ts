import { expect, test } from "bun:test";
import { appConfig } from "./config";

test("platform configuration preserves frontend product requirements", () => {
  expect(appConfig.name).toBe("Opinny");
  expect(appConfig.cryptoOnly).toBe(true);
  expect(appConfig.lightModeOnly).toBe(true);
  expect(appConfig.supportedAssets.length).toBeGreaterThan(0);
  expect(appConfig.features.adminConsole).toBe(true);
  expect(appConfig.features.cryptoFunding).toBe(true);
});
