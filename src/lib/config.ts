export const appConfig = {
  name: "Opinny",
  collateral: process.env.NEXT_PUBLIC_OPINNY_COLLATERAL_SYMBOL ?? "USDC",
  chainId: Number(process.env.NEXT_PUBLIC_OPINNY_CHAIN_ID ?? 137),
  adapter: process.env.NEXT_PUBLIC_OPINNY_DATA_ADAPTER ?? "mock",
  apiUrl: process.env.NEXT_PUBLIC_OPINNY_API_URL ?? "",
  webSocketUrl: process.env.NEXT_PUBLIC_OPINNY_WS_URL ?? ""
} as const;
