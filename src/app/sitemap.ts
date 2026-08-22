import type { MetadataRoute } from "next";
import { dataAdapter } from "@/lib/data";
import { appConfig } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!appConfig.siteUrl) return [];

  const markets = await dataAdapter.listMarkets();
  const traders = await dataAdapter.getLeaderboard();
  const staticRoutes = ["", "/markets", "/rewards", "/leaderboard", "/help", "/privacy", "/risk", "/terms"];

  const staticEntries = staticRoutes.map((path) => ({ url: `${appConfig.siteUrl}${path}` }));
  const marketEntries = markets.map((market) => ({ url: `${appConfig.siteUrl}/market/${market.slug}`, lastModified: new Date(market.createdAt) }));
  const traderEntries = traders.map((trader) => ({ url: `${appConfig.siteUrl}/profile/${trader.handle}` }));

  return [...staticEntries, ...marketEntries, ...traderEntries];
}
