export type MarketStatus = "open" | "paused" | "resolved" | "draft";
export type MarketKind = "binary" | "multi";
export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type OrderStatus = "open" | "filled" | "partially-filled" | "cancelled";

export interface Outcome {
  id: string;
  label: string;
  probability: number;
  change24h: number;
  volume24h: number;
  tokenId?: string;
}

export interface Market {
  id: string;
  slug: string;
  question: string;
  shortQuestion: string;
  description: string;
  category: string;
  tags: string[];
  kind: MarketKind;
  status: MarketStatus;
  imageTone: string;
  icon: string;
  outcomes: Outcome[];
  volume: number;
  volume24h: number;
  liquidity: number;
  traders: number;
  endDate: string;
  createdAt: string;
  featured?: boolean;
  live?: boolean;
  bookmarked?: boolean;
  resolutionSource: string;
  resolutionRules: string;
  chart: number[];
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface RecentTrade {
  id: string;
  side: OrderSide;
  outcome: string;
  price: number;
  shares: number;
  value: number;
  trader: string;
  time: string;
}

export interface Position {
  id: string;
  marketId: string;
  marketSlug: string;
  marketQuestion: string;
  outcome: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

export interface UserOrder {
  id: string;
  marketQuestion: string;
  marketSlug: string;
  outcome: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  shares: number;
  filled: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderIntent {
  clientRequestId: string;
  marketId: string;
  outcomeId: string;
  side: OrderSide;
  type: OrderType;
  collateralAmount?: number;
  shares?: number;
  limitPrice?: number;
  maxSlippageBps?: number;
}

export interface OrderPreview {
  estimatedPrice: number;
  estimatedShares: number;
  estimatedCollateral: number;
  estimatedFee: number;
  priceImpactBps: number;
}

export interface WalletTransactionRequest {
  chainId: number;
  to: string;
  data: string;
  value: string;
}

export interface PreparedOrder {
  requestId: string;
  expiresAt: string;
  preview: OrderPreview;
  walletRequest?: WalletTransactionRequest;
}

export interface CommandResult {
  id: string;
  status: "accepted" | "pending" | "rejected";
  message: string;
}

export interface FundingIntent {
  type: "deposit" | "withdrawal";
  asset: string;
  amount: number;
  chainId: number;
  destination?: string;
}

export interface PreparedFundingAction {
  requestId: string;
  expiresAt: string;
  walletRequest: WalletTransactionRequest;
}

export type MarketStreamEvent =
  | { type: "snapshot"; marketId: string; sequence: number }
  | { type: "price"; marketId: string; outcomeId: string; probability: number; sequence: number }
  | { type: "order-book"; marketId: string; outcomeId: string; sequence: number }
  | { type: "trade"; marketId: string; trade: RecentTrade; sequence: number }
  | { type: "status"; marketId: string; status: MarketStatus; sequence: number };

export interface AdminMarketInput {
  question: string;
  category: string;
  kind: MarketKind;
  outcomes: string[];
  endDate: string;
  resolutionSource: string;
  resolutionRules: string;
}

export interface ActivityItem {
  id: string;
  type: "trade" | "deposit" | "withdrawal" | "resolution" | "reward";
  title: string;
  description: string;
  amount?: number;
  time: string;
}

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  displayName: string;
  initials: string;
  profit: number;
  volume: number;
  accuracy: number;
  streak: number;
}

export interface AdminMetric {
  label: string;
  value: string;
  change: number;
  hint: string;
}

export interface AdminUser {
  id: string;
  handle: string;
  wallet: string;
  joined: string;
  volume: number;
  balance: number;
  status: "active" | "review" | "suspended";
  risk: "low" | "medium" | "high";
}

export interface ResolutionCase {
  id: string;
  market: string;
  endDate: string;
  proposedOutcome: string;
  source: string;
  disputes: number;
  status: "awaiting" | "proposed" | "disputed" | "approved";
}

export interface TransactionRecord {
  id: string;
  type: "deposit" | "withdrawal" | "trade" | "reward";
  wallet: string;
  asset: string;
  amount: number;
  txHash: string;
  status: "confirmed" | "pending" | "failed";
  time: string;
}
