import { expect, test } from "bun:test";
import { formatCurrency, formatNumber } from "./format";

test("compact formatting is deterministic across server and browser runtimes", () => {
  expect(formatCurrency(10_000_000, { compact: true })).toBe("$10M");
  expect(formatCurrency(880_000, { compact: true })).toBe("$880K");
  expect(formatCurrency(9_350_000, { compact: true })).toBe("$9.4M");
  expect(formatCurrency(-1_250_000, { compact: true })).toBe("-$1.3M");
  expect(formatNumber(66_400, true)).toBe("66.4K");
  expect(formatNumber(10_000, true)).toBe("10K");
});

test("compact formatting promotes rounded values to the next unit", () => {
  expect(formatCurrency(999_950, { compact: true })).toBe("$1M");
  expect(formatNumber(999_950, true)).toBe("1M");
});
