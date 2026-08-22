import { expect, test } from "bun:test";
import { getFocusWrapTarget } from "./focus";

test("focus wrap keeps keyboard navigation inside modal boundaries", () => {
  expect(getFocusWrapTarget(3, 0, true)).toBe(2);
  expect(getFocusWrapTarget(3, 2, false)).toBe(0);
  expect(getFocusWrapTarget(3, -1, false)).toBe(0);
  expect(getFocusWrapTarget(3, -1, true)).toBe(2);
});

test("focus wrap leaves middle navigation to the browser", () => {
  expect(getFocusWrapTarget(4, 1, false)).toBeNull();
  expect(getFocusWrapTarget(4, 2, true)).toBeNull();
});

test("focus wrap ignores empty or invalid collections", () => {
  expect(getFocusWrapTarget(0, 0, false)).toBeNull();
  expect(getFocusWrapTarget(-1, 0, false)).toBeNull();
  expect(getFocusWrapTarget(1.5, 0, false)).toBeNull();
});
