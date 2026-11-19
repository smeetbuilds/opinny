/** Runtime-created markets use a static client route because the reference site is statically exported. */
export function marketHref(slug: string, marketId?: string, outcomeId?: string): string {
  const base = marketId?.startsWith("paper-market-") ? "/market/paper?id=" + encodeURIComponent(marketId) : "/market/" + encodeURIComponent(slug);
  return outcomeId ? base + (base.includes("?") ? "&" : "?") + "outcome=" + encodeURIComponent(outcomeId) : base;
}
