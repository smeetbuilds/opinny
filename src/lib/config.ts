export function normalizeChainId(value: string | number | undefined, fallback = 137) {
  const parsed = Number(value ?? fallback);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSiteUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

const collateral = process.env.NEXT_PUBLIC_OPINNY_COLLATERAL_SYMBOL?.trim().toUpperCase() || "USDC";
const supportedAssets = (process.env.NEXT_PUBLIC_OPINNY_SUPPORTED_ASSETS ?? "USDC,USDT,DAI")
  .split(",")
  .map((asset) => asset.trim().toUpperCase())
  .filter(Boolean);

export const appConfig = {
  name: "Opinny",
  description: "A crypto-only prediction-market platform interface.",
  cryptoOnly: true,
  lightModeOnly: true,
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_OPINNY_SITE_URL),
  collateral,
  supportedAssets: supportedAssets.length ? supportedAssets : [collateral],
  chainId: normalizeChainId(process.env.NEXT_PUBLIC_OPINNY_CHAIN_ID),
  chainName: process.env.NEXT_PUBLIC_OPINNY_CHAIN_NAME?.trim() || "Polygon",
  blockExplorerUrl: process.env.NEXT_PUBLIC_OPINNY_BLOCK_EXPLORER_URL?.trim() || "https://polygonscan.com",
  adapter: process.env.NEXT_PUBLIC_OPINNY_DATA_ADAPTER?.trim() || "mock",
  apiUrl: process.env.NEXT_PUBLIC_OPINNY_API_URL?.trim() || "",
  webSocketUrl: process.env.NEXT_PUBLIC_OPINNY_WS_URL?.trim() || "",
  errorReportUrl: process.env.NEXT_PUBLIC_OPINNY_ERROR_REPORT_URL?.trim() || "",
  adminPath: process.env.NEXT_PUBLIC_OPINNY_ADMIN_PATH?.trim() || "/admin",
  features: {
    marketDiscovery: true,
    multiOutcomeMarkets: true,
    orderBook: true,
    marketOrders: true,
    limitOrders: true,
    watchlist: true,
    portfolio: true,
    notifications: true,
    cryptoFunding: true,
    adminConsole: true
  }
} as const;

export type AppConfig = typeof appConfig;
