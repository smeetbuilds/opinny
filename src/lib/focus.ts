export function getFocusWrapTarget(length: number, activeIndex: number, backwards: boolean): number | null {
  if (!Number.isSafeInteger(length) || length <= 0) return null;
  if (backwards && activeIndex <= 0) return length - 1;
  if (!backwards && (activeIndex < 0 || activeIndex >= length - 1)) return 0;
  return null;
}
