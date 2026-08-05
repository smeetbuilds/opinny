import type {
  ActivityItem,
  AdminMarketInput,
  AdminMetric,
  AdminUser,
  CommandResult,
  FundingIntent,
  LeaderboardEntry,
  Market,
  MarketStreamEvent,
  OrderBookLevel,
  OrderIntent,
  OrderPreview,
  Position,
  PreparedFundingAction,
  PreparedOrder,
  RecentTrade,
  ResolutionCase,
  TransactionRecord,
  UserOrder
} from "./domain";

export interface MarketQuery {
  category?: string;
  search?: string;
  sort?: "trending" | "volume" | "newest" | "ending";
  status?: "open" | "resolved";
  bookmarked?: boolean;
}

export interface MarketDataPort {
  listMarkets(query?: MarketQuery): Promise<Market[]>;
  getMarket(slug: string): Promise<Market | null>;
  getOrderBook(marketId: string, outcomeId: string): Promise<{
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  }>;
  getRecentTrades(marketId: string): Promise<RecentTrade[]>;
}

export interface AccountDataPort {
  getPositions(): Promise<Position[]>;
  getOrders(): Promise<UserOrder[]>;
  getActivity(): Promise<ActivityItem[]>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

export interface AdminDataPort {
  getMetrics(): Promise<AdminMetric[]>;
  getUsers(): Promise<AdminUser[]>;
  getResolutionQueue(): Promise<ResolutionCase[]>;
  getTransactions(): Promise<TransactionRecord[]>;
}

export interface TradingCommandPort {
  previewOrder(intent: OrderIntent): Promise<OrderPreview>;
  prepareOrder(intent: OrderIntent): Promise<PreparedOrder>;
  cancelOrder(orderId: string): Promise<CommandResult>;
}

export interface AccountCommandPort {
  redeemPosition(positionId: string): Promise<CommandResult>;
}

export interface FundingCommandPort {
  prepareFunding(intent: FundingIntent): Promise<PreparedFundingAction>;
}

export interface AdminCommandPort {
  createMarket(input: AdminMarketInput): Promise<CommandResult>;
  updateUserStatus(userId: string, status: AdminUser["status"]): Promise<CommandResult>;
  resolveMarket(caseId: string, outcome: string): Promise<CommandResult>;
}

export interface RealtimePort {
  subscribeToMarket(marketId: string, onEvent: (event: MarketStreamEvent) => void): () => void;
}

export interface OpinnyDataAdapter extends MarketDataPort, AccountDataPort, AdminDataPort {}

export interface OpinnyIntegrationAdapter
  extends OpinnyDataAdapter,
    TradingCommandPort,
    AccountCommandPort,
    FundingCommandPort,
    AdminCommandPort,
    RealtimePort {}
