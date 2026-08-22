import { expect, test } from "bun:test";
import { createOpinnyAdapter } from "./data";

test("adapter registry fails closed for an unknown production adapter", () => {
  expect(() => createOpinnyAdapter("unregistered-production-adapter")).toThrow("Unsupported NEXT_PUBLIC_OPINNY_DATA_ADAPTER");
});

test("adapter registry returns the registered reference adapter", () => {
  expect(createOpinnyAdapter("mock")).toBeDefined();
});
