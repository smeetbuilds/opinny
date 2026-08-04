const chainId = Number(process.env.NEXT_PUBLIC_OPINNY_CHAIN_ID ?? 137);
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
  collateral,
  supportedAssets: supportedAssets.length ? supportedAssets : [collateral],
  chainId: Number.isFinite(chainId) ? chainId : 137,
  chainName: process.env.NEXT_PUBLIC_OPINNY_CHAIN_NAME?.trim() || "Polygon",
  blockExplorerUrl: process.env.NEXT_PUBLIC_OPINNY_BLOCK_EXPLORER_URL?.trim() || "https://polygonscan.com",
  adapter: process.env.NEXT_PUBLIC_OPINNY_DATA_ADAPTER?.trim() || "mock",
  apiUrl: process.env.NEXT_PUBLIC_OPINNY_API_URL?.trim() || "",
  webSocketUrl: process.env.NEXT_PUBLIC_OPINNY_WS_URL?.trim() || "",
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
