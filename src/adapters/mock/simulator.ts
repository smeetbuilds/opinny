import type { AccountBalance, ActivityItem, AdminMarketInput, AdminUser, FundingIntent, Market, MarketComment, MarketCommentInput, MarketStatus, OrderBookLevel, OrderIntent, OrderPreview, Position, RecentTrade, ResolutionCase, TransactionRecord, UserOrder } from "@/core/contracts/domain";
import { appConfig } from "@/lib/config";
import { activity as seedActivity, adminUsers as seedAdminUsers, markets, orders as seedOrders, positions as seedPositions, resolutions as seedResolutions, transactions as seedTransactions } from "./data";

/**
 * A local, deterministic paper exchange. This is NOT a matching engine or wallet.
 * Every command is synchronous and explicitly confirmed after the reference wallet
 * approves it. State belongs to the browser only; static server renders stay pure.
 */
const KEY = "opinny-paper-exchange-v1";
const FEE_RATE = 0.001;
type PaperOrder = UserOrder & { marketId?: string; outcomeId?: string; reservedCollateral?: number };
type PaperTrade = RecentTrade & { marketId: string };
type PaperState = {
  version: 1;
  balances: Record<string, number>;
  positions: Position[];
  orders: PaperOrder[];
  activity: ActivityItem[];
  trades: PaperTrade[];
  fundedRequests: string[];
  fundingIntents?: Record<string, string>;
  transactions?: TransactionRecord[];
  comments?: MarketComment[];
  useful?: Record<string, boolean>;
  createdMarkets?: Market[];
  marketStatuses?: Record<string, MarketStatus>;
  userStatuses?: Record<string, AdminUser["status"]>;
  resolutionDecisions?: Record<string, { status: ResolutionCase["status"]; outcome: string }>;
  resolvedMarkets?: Record<string, string>;
};
let cache: PaperState | null = null;

const round = (n: number) => Math.round((n + Number.EPSILON) * 1_000_000) / 1_000_000;
const active = (order: PaperOrder) => order.status === "open" || order.status === "partially-filled";
const remaining = (order: PaperOrder) => Math.max(0, order.shares - order.filled);
/** All admin writes are local sandbox state; production authorization lives elsewhere. */
export function paperMarkets(): Market[] {
  const current = state();
  return [...(current.createdMarkets ?? []), ...markets].map((market) => ({
    ...market,
    status: current.resolvedMarkets?.[market.id] ? "resolved" : (current.marketStatuses?.[market.id] ?? market.status) === "open" && Date.parse(market.endDate) <= Date.now() ? "paused" : current.marketStatuses?.[market.id] ?? market.status
  }));
}
export function paperAdminUsers(): AdminUser[] {
  return seedAdminUsers.map((user) => ({ ...user, status: state().userStatuses?.[user.id] ?? user.status }));
}
export function paperResolutionCases(): ResolutionCase[] {
  return seedResolutions.map((item) => ({
    ...item,
    status: state().resolutionDecisions?.[item.id]?.status ?? item.status,
    proposedOutcome: state().resolutionDecisions?.[item.id]?.outcome ?? item.proposedOutcome
  }));
}
export function createPaperMarket(input: AdminMarketInput): string {
  const labels = input.outcomes.map((item) => item.trim()).filter(Boolean);
  if (!input.question.trim() || input.question.trim().length > 180) throw new Error("Enter a market question of 1–180 characters.");
  if (labels.length < 2 || (input.kind === "binary" && labels.length !== 2) || new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) throw new Error("Provide unique outcomes matching the market type.");
  const closeAt = new Date(input.endDate);
  if (!Number.isFinite(closeAt.getTime()) || closeAt.getTime() <= Date.now()) throw new Error("Choose a future closing time.");
  if (!input.resolutionSource.trim() || !input.resolutionRules.trim()) throw new Error("Resolution source and rules are required.");
  const id = "paper-market-" + Date.now();
  const slug = input.question.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) + "-" + Date.now().toString(36);
  const base = Math.floor(100 / labels.length);
  const extra = 100 - base * labels.length;
  const market: Market = {
    id, slug, question: input.question.trim(), shortQuestion: input.question.trim(),
    description: input.resolutionRules.trim(), category: input.category, tags: [input.category],
    kind: input.kind, status: "draft", imageTone: "tone-green", icon: "◎",
    outcomes: labels.map((label, index) => ({
      id: id + "-outcome-" + (index + 1), label, probability: base + (index < extra ? 1 : 0),
      change24h: 0, volume24h: 0
    })),
    volume: 0, volume24h: 0, liquidity: 0, traders: 0,
    endDate: closeAt.toISOString(), createdAt: new Date().toISOString(),
    resolutionSource: input.resolutionSource.trim(),
    resolutionRules: input.resolutionRules.trim(),
    chart: [50, 50, 50, 50]
  };
  state().createdMarkets ??= [];
  state().createdMarkets!.unshift(market);
  save();
  return id;
}
export function setPaperMarketStatus(id: string, next: MarketStatus): string {
  const market = paperMarkets().find((item) => item.id === id);
  if (!market) throw new Error("Market not found.");
  if (!(market.status === "draft" && next === "open" && (state().createdMarkets ?? []).some((item) => item.id === id)) && (!["open", "paused"].includes(market.status) || !["open", "paused"].includes(next))) throw new Error("Only draft paper markets can be published, or open/paused markets toggled.");
  if (next === "open" && Date.parse(market.endDate) <= Date.now()) throw new Error("Expired markets cannot be opened.");
  state().marketStatuses ??= {};
  state().marketStatuses![id] = next;
  event("resolution", "Market " + next, market.shortQuestion);
  save();
  return "Paper market " + next + ".";
}
export function setPaperUserStatus(id: string, next: AdminUser["status"]): string {
  if (!seedAdminUsers.some((user) => user.id === id)) throw new Error("Account not found.");
  if (!["active", "review", "suspended"].includes(next)) throw new Error("Unsupported access status.");
  state().userStatuses ??= {};
  state().userStatuses![id] = next;
  save();
  return "Paper account status changed to " + next + ".";
}
export function setPaperResolution(id: string, outcome: string): string {
  const item = paperResolutionCases().find((caseItem) => caseItem.id === id);
  if (!item) throw new Error("Resolution case not found.");
  if (item.status === "approved") throw new Error("Resolution already approved.");
  if (!outcome.trim()) throw new Error("Select a resolution outcome.");
  const linked = paperMarkets().find((market) => market.question === item.market || market.shortQuestion === item.market);
  if (linked && !linked.outcomes.some((candidate) => candidate.label === outcome || candidate.id === outcome)) throw new Error("The selected outcome does not belong to this market.");
  state().resolutionDecisions ??= {};
  state().resolutionDecisions![id] = { status: "approved", outcome };
  event("resolution", "Paper case approved", item.market + " · " + outcome);
  if (linked) settlePaperMarket(linked.id, outcome);
  save();
  return "Paper resolution approved for " + outcome + ".";
}
/** Resolve a simulated market and turn its positions into redeemable payouts. */
export function settlePaperMarket(marketId: string, winningOutcome: string): string {
  const current = state();
  const market = paperMarkets().find((item) => item.id === marketId);
  if (!market) throw new Error("Market not found.");
  const winner = market.outcomes.find((item) => item.id === winningOutcome || item.label === winningOutcome);
  if (!winner) throw new Error("Winning outcome does not belong to this market.");
  if (current.resolvedMarkets?.[marketId]) {
    if (current.resolvedMarkets[marketId] !== winner.id) throw new Error("Market was already settled with another outcome.");
    return "Market already settled.";
  }
  if (market.status === "draft") throw new Error("Publish the market before resolving it.");
  for (const order of current.orders) {
    if (!active(order) || order.marketId !== marketId) continue;
    if (order.side === "buy") {
      current.balances[appConfig.collateral] = round((current.balances[appConfig.collateral] ?? 0) + (order.reservedCollateral ?? 0));
      order.reservedCollateral = 0;
    }
    order.status = "cancelled";
  }
  const now = new Date().toISOString();
  for (const position of current.positions) {
    if (position.marketId !== marketId || position.status !== "open") continue;
    const won = position.outcome === winner.label;
    position.status = "resolved";
    position.resolvedOutcome = winner.label;
    position.resolvedAt = now;
    position.currentPrice = won ? 1 : 0;
    position.value = won ? round(position.shares) : 0;
    position.claimableAmount = won ? round(position.shares) : 0;
    position.pnl = round(position.value - position.shares * position.averagePrice);
    position.pnlPercent = position.averagePrice ? round((position.currentPrice / position.averagePrice - 1) * 100) : 0;
  }
  current.resolvedMarkets ??= {};
  current.resolvedMarkets[marketId] = winner.id;
  event("resolution", "Market resolved", market.shortQuestion + " · " + winner.label);
  save();
  return "Paper market settled. Winning positions can now be redeemed.";
}
const opening = (marketId: string, outcome: string) => paperMarkets().find((market) => market.id === marketId)?.outcomes.find((item) => item.id === outcome);
const marketFor = (marketId: string): Market => {
  const market = paperMarkets().find((item) => item.id === marketId);
  if (!market || market.status !== "open" || Date.parse(market.endDate) <= Date.now()) throw new Error("This market is not open for trading.");
  return market;
};

function initialState(): PaperState {
  return {
    version: 1,
    balances: Object.fromEntries(appConfig.supportedAssets.map((asset, index) => [asset, asset === appConfig.collateral ? round(3842.16 - seedOrders.filter((order) => active(order) && order.side === "buy").reduce((sum, order) => sum + remaining(order) * order.price * (1 + FEE_RATE), 0)) : index === 1 ? 1200 : 800])),
    positions: [...seedPositions.map((position) => ({ ...position })), {
      id: "pos-seed-partial", marketId: "mkt-003", marketSlug: markets[2].slug,
      marketQuestion: markets[2].shortQuestion, outcome: "2 cuts", shares: 240,
      averagePrice: 0.34, currentPrice: 0.38, value: 91.2, pnl: 9.6,
      pnlPercent: 11.76, status: "open" as const
    }],
    orders: seedOrders.map((order) => ({
      ...order,
      marketId: markets.find((market) => market.slug === order.marketSlug)?.id,
      outcomeId: markets.find((market) => market.slug === order.marketSlug)?.outcomes.find((outcome) => outcome.label === order.outcome)?.id,
      reservedCollateral: active(order) && order.side === "buy" ? round(remaining(order) * order.price * (1 + FEE_RATE)) : 0
    })),
    activity: seedActivity.map((item) => ({ ...item })),
    trades: [],
    fundedRequests: [],
    fundingIntents: {},
    transactions: [],
    comments: [],
    useful: {},
    createdMarkets: [],
    marketStatuses: {},
    userStatuses: {},
    resolutionDecisions: {},
    resolvedMarkets: {}
  };
}

function state(): PaperState {
  if (cache) return cache;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          const data = saved as Partial<PaperState>;
          if (data.version === 1 && data.balances && Array.isArray(data.positions) && Array.isArray(data.orders) && Array.isArray(data.activity) && Array.isArray(data.trades) && Array.isArray(data.fundedRequests)) {
            cache = data as PaperState;
            return cache;
          }
        }
      }
    } catch { /* Private browsing and invalid storage recover to reference data. */ }
  }
  cache = initialState();
  return cache;
}

function save() {
  const current = state();
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* No persistence in restricted browsers. */ }
    window.dispatchEvent(new CustomEvent("opinny:paper-update"));
  }
}
function ledger(type: TransactionRecord["type"], amount: number, asset = appConfig.collateral) {
  const current = state();
  current.transactions ??= [];
  const id = "paper-tx-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  current.transactions.unshift({
    id, type, asset, amount: round(amount),
    wallet: "Paper wallet", txHash: id, status: "confirmed",
    time: "Just now", createdAt: new Date().toISOString()
  });
}
export function paperTransactions(): TransactionRecord[] {
  const baseline = seedTransactions.map((tx, index) => ({
    ...tx,
    createdAt: new Date(Date.UTC(2026, 7, 4, 12, -index * 7)).toISOString()
  }));
  return [...(state().transactions ?? []), ...baseline];
}

function event(type: ActivityItem["type"], title: string, description: string, amount?: number) {
  state().activity.unshift({
    id: "act-paper-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    type, title, description, amount: amount === undefined ? undefined : round(amount), time: "Just now"
  });
}
function freeShares(marketId: string, outcomeLabel: string): number {
  const current = state();
  const held = current.positions.filter((position) => position.marketId === marketId && position.outcome === outcomeLabel && position.status === "open").reduce((sum, position) => sum + position.shares, 0);
  const reserved = current.orders.filter((order) => active(order) && order.side === "sell" && order.marketId === marketId && order.outcome === outcomeLabel).reduce((sum, order) => sum + remaining(order), 0);
  return Math.max(0, round(held - reserved));
}
function creditShares(market: Market, label: string, price: number, quantity: number) {
  const current = state();
  const position = current.positions.find((item) => item.marketId === market.id && item.outcome === label && item.status === "open");
  if (position) {
    const cost = position.averagePrice * position.shares + price * quantity;
    position.shares = round(position.shares + quantity);
    position.averagePrice = round(cost / position.shares);
  } else {
    current.positions.unshift({
      id: "pos-paper-" + market.id + "-" + label.toLowerCase().replace(/[^a-z0-9]/g, ""),
      marketId: market.id, marketSlug: market.slug, marketQuestion: market.shortQuestion,
      outcome: label, shares: quantity, averagePrice: price, currentPrice: price,
      value: round(price * quantity), pnl: 0, pnlPercent: 0, status: "open"
    });
  }
}
function debitShares(marketId: string, label: string, quantity: number) {
  const position = state().positions.find((item) => item.marketId === marketId && item.outcome === label && item.status === "open");
  if (!position || position.shares + 1e-6 < quantity) throw new Error("Not enough shares to sell.");
  position.shares = round(Math.max(0, position.shares - quantity));
  if (position.shares <= 1e-6) state().positions = state().positions.filter((item) => item !== position);
}
function recordTrade(market: Market, side: "buy" | "sell", label: string, price: number, quantity: number) {
  state().trades.unshift({
    id: "trade-paper-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), marketId: market.id, side, outcome: label,
    price, shares: quantity, value: round(price * quantity), trader: "You · paper", time: "Now"
  });
  state().trades = state().trades.slice(0, 100);
  ledger("trade", price * quantity);
  event("trade", (side === "buy" ? "Bought " : "Sold ") + round(quantity).toLocaleString() + " " + label + " shares", market.shortQuestion, side === "buy" ? -round(price * quantity * (1 + FEE_RATE)) : round(price * quantity * (1 - FEE_RATE)));
}

export function previewPaperOrder(intent: OrderIntent): OrderPreview {
  const market = marketFor(intent.marketId);
  const outcome = opening(market.id, intent.outcomeId);
  if (!outcome || outcome.probability <= 0 || outcome.probability >= 100) throw new Error("This outcome cannot be traded.");
  if (intent.type !== "market" && intent.type !== "limit") throw new Error("Unsupported order type.");
  if (intent.side !== "buy" && intent.side !== "sell") throw new Error("Unsupported trade direction.");
  if (intent.type === "limit" && (!Number.isFinite(intent.limitPrice) || !intent.limitPrice || intent.limitPrice <= 0 || intent.limitPrice >= 1)) throw new Error("Limit price must be between 1¢ and 99¢.");
  const quote = outcome.probability / 100;
  const crossing = intent.type === "market" || (intent.side === "buy" ? (intent.limitPrice ?? 0) >= quote : (intent.limitPrice ?? 1) <= quote);
  const price = crossing ? quote : intent.limitPrice!;
  const budget = intent.collateralAmount ?? 0;
  const quantity = intent.side === "buy" ? budget / (price * (1 + FEE_RATE)) : intent.shares ?? 0;
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000_000) throw new Error("Enter a valid, positive order size.");
  if (intent.side === "buy" && (!Number.isFinite(budget) || budget > 1_000_000_000)) throw new Error("Enter a valid collateral amount.");
  if (intent.side === "sell" && quantity > freeShares(market.id, outcome.label) + 1e-6) throw new Error("Insufficient unreserved " + outcome.label + " shares.");
  if (intent.side === "buy" && budget > (state().balances[appConfig.collateral] ?? 0) + 1e-6) throw new Error("Insufficient available " + appConfig.collateral + " balance.");
  const collateral = round(quantity * price);
  const fee = round(collateral * FEE_RATE);
  return {
    estimatedPrice: price, estimatedShares: round(quantity), estimatedCollateral: collateral,
    estimatedFee: fee, estimatedPayout: intent.side === "buy" ? round(quantity) : round(collateral - fee),
    priceImpactBps: 0
  };
}

export function paperBalances(): AccountBalance[] {
  const current = state();
  const locked = current.orders.filter((order) => active(order) && order.side === "buy").reduce((sum, order) => sum + (order.reservedCollateral ?? 0), 0);
  return appConfig.supportedAssets.map((asset) => ({
    asset, available: round(current.balances[asset] ?? 0), locked: asset === appConfig.collateral ? round(locked) : 0
  }));
}
export function paperPositions(): Position[] {
  return state().positions.filter((position) => position.shares > 0).map((position) => {
    if (position.status !== "open") return { ...position };
    const currentPrice = paperMarkets().find((market) => market.id === position.marketId)?.outcomes.find((outcome) => outcome.label === position.outcome)?.probability;
    const price = currentPrice === undefined ? position.currentPrice : currentPrice / 100;
    const value = round(position.shares * price);
    const pnl = round(value - position.shares * position.averagePrice);
    return { ...position, currentPrice: price, value, pnl, pnlPercent: position.averagePrice ? round((price / position.averagePrice - 1) * 100) : 0 };
  });
}
export const paperOrders = (): UserOrder[] => state().orders.map((order) => ({ ...order }));
export const paperActivity = (): ActivityItem[] => state().activity.map((item) => ({ ...item }));
export const paperTrades = (marketId: string): RecentTrade[] => state().trades.filter((trade) => trade.marketId === marketId).map((trade) => ({ ...trade }));

/** Synthetic depth is generated from the selected outcome, not an unrelated market. */
export function paperOrderBook(marketId: string, outcomeId: string): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const outcome = opening(marketId, outcomeId);
  if (!outcome) return { bids: [], asks: [] };
  const quote = outcome.probability / 100;
  function build(side: "buy" | "sell"): OrderBookLevel[] {
    const offers = [1200, 2400, 3100, 5800].map((size, index) => ({
      price: Math.min(0.99, Math.max(0.01, round(quote + (side === "buy" ? -1 : 1) * (index + 1) / 100))),
      size
    }));
    for (const order of state().orders) {
      if (active(order) && order.type === "limit" && order.marketId === marketId && order.outcomeId === outcomeId && order.side === side) {
        offers.push({ price: order.price, size: remaining(order) });
      }
    }
    const aggregated = new Map<number, number>();
    for (const row of offers) aggregated.set(row.price, round((aggregated.get(row.price) ?? 0) + row.size));
    let total = 0;
    return [...aggregated].sort((a, b) => side === "buy" ? b[0] - a[0] : a[0] - b[0]).map(([price, size]) => {
      total = round(total + size);
      return { price, size, total };
    });
  }
  return { bids: build("buy"), asks: build("sell") };
}

export function executePaperOrder(intent: OrderIntent): string {
  const current = state();
  const existing = current.orders.find((order) => order.id === intent.clientRequestId);
  if (existing) return existing.status === "filled" ? "Order already filled." : "Order already placed.";
  const preview = previewPaperOrder(intent);
  const market = marketFor(intent.marketId);
  const outcome = opening(market.id, intent.outcomeId)!;
  const quote = outcome.probability / 100;
  const crosses = intent.type === "market" || (intent.side === "buy" ? intent.limitPrice! >= quote : intent.limitPrice! <= quote);
  const quantity = preview.estimatedShares;
  const available = current.balances[appConfig.collateral] ?? 0;
  if (intent.side === "buy" && available + 1e-6 < (intent.collateralAmount ?? 0)) throw new Error("Insufficient available " + appConfig.collateral + " balance.");
  if (intent.side === "sell" && quantity > freeShares(market.id, outcome.label) + 1e-6) throw new Error("Insufficient unreserved " + outcome.label + " shares.");
  const order: PaperOrder = {
    id: intent.clientRequestId, marketId: market.id, outcomeId: outcome.id,
    marketSlug: market.slug, marketQuestion: market.shortQuestion, outcome: outcome.label,
    side: intent.side, type: intent.type, price: preview.estimatedPrice, shares: quantity,
    filled: crosses ? quantity : 0, status: crosses ? "filled" : "open",
    createdAt: new Date().toISOString(), reservedCollateral: 0
  };
  if (crosses) {
    if (intent.side === "buy") {
      current.balances[appConfig.collateral] = round(available - preview.estimatedCollateral - preview.estimatedFee);
      creditShares(market, outcome.label, preview.estimatedPrice, quantity);
    } else {
      debitShares(market.id, outcome.label, quantity);
      current.balances[appConfig.collateral] = round(available + preview.estimatedPayout);
    }
    recordTrade(market, intent.side, outcome.label, preview.estimatedPrice, quantity);
  } else if (intent.side === "buy") {
    order.reservedCollateral = round(intent.collateralAmount ?? 0);
    current.balances[appConfig.collateral] = round(available - order.reservedCollateral);
  }
  current.orders.unshift(order);
  if (!crosses) event("trade", "Limit order placed", market.shortQuestion + " · " + outcome.label + " at " + Math.round(order.price * 100) + "¢");
  save();
  return crosses ? "Paper trade filled at " + Math.round(order.price * 100) + "¢." : "Limit order posted. Funds or shares are reserved until filled or cancelled.";
}

export function cancelPaperOrder(id: string): string {
  const order = state().orders.find((item) => item.id === id);
  if (!order) throw new Error("Order was not found.");
  if (!active(order)) throw new Error("Only open orders can be cancelled.");
  if (order.side === "buy") {
    state().balances[appConfig.collateral] = round((state().balances[appConfig.collateral] ?? 0) + (order.reservedCollateral ?? 0));
    order.reservedCollateral = 0;
  }
  order.status = "cancelled";
  event("trade", "Limit order cancelled", order.marketQuestion + " · " + order.outcome);
  save();
  return "Unfilled order cancelled and remaining collateral or shares released.";
}

/** Explicit demo-only counterparty action. Fills half the remainder, then the rest. */
export function matchPaperOrder(id: string): string {
  const current = state();
  const order = current.orders.find((item) => item.id === id);
  if (!order || !active(order) || order.type !== "limit") throw new Error("Select an open limit order.");
  const market = marketFor(order.marketId ?? "");
  const quantity = order.filled > 0 ? remaining(order) : round(remaining(order) / 2);
  const finalQuantity = quantity <= 0 || round(remaining(order) - quantity) < 0.000001 ? remaining(order) : quantity;
  if (order.side === "buy") {
    const spent = round(finalQuantity * order.price * (1 + FEE_RATE));
    if ((order.reservedCollateral ?? 0) + 1e-6 < spent) throw new Error("Insufficient reserved collateral.");
    order.reservedCollateral = round(Math.max(0, (order.reservedCollateral ?? 0) - spent));
    creditShares(market, order.outcome, order.price, finalQuantity);
  } else {
    debitShares(market.id, order.outcome, finalQuantity);
    current.balances[appConfig.collateral] = round((current.balances[appConfig.collateral] ?? 0) + finalQuantity * order.price * (1 - FEE_RATE));
  }
  order.filled = round(order.filled + finalQuantity);
  order.status = remaining(order) < 0.000001 ? "filled" : "partially-filled";
  if (order.status === "filled" && order.reservedCollateral) {
    current.balances[appConfig.collateral] = round((current.balances[appConfig.collateral] ?? 0) + order.reservedCollateral);
    order.reservedCollateral = 0;
  }
  recordTrade(market, order.side, order.outcome, order.price, finalQuantity);
  save();
  return order.status === "filled" ? "Limit order fully matched in simulation." : "A simulated counterparty filled 50% of the original shares.";
}

export function redeemPaperPosition(id: string): string {
  const position = state().positions.find((item) => item.id === id);
  if (!position) throw new Error("Position was not found.");
  if (position.status !== "resolved" || (position.claimableAmount ?? 0) <= 0) throw new Error("Position is not claimable.");
  const amount = position.claimableAmount ?? 0;
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid claim amount.");
  state().balances[appConfig.collateral] = round((state().balances[appConfig.collateral] ?? 0) + amount);
  position.status = "claimed";
  position.claimableAmount = 0;
  event("resolution", "Winning position redeemed", position.marketQuestion, amount);
  save();
  return "Paper payout credited to your collateral balance.";
}

export function settlePaperFunding(intent: FundingIntent, requestId: string): string {
  const current = state();
  if (!requestId.trim()) throw new Error("Funding request identifier is required.");
  const signature = JSON.stringify([intent.type, intent.asset, intent.chainId, intent.amount, intent.destination ?? ""]);
  if (current.fundedRequests.includes(requestId)) {
    if (current.fundingIntents?.[requestId] && current.fundingIntents[requestId] !== signature) throw new Error("Funding identifier was already used for a different request.");
    return "Funding request already applied.";
  }
  if (!appConfig.supportedAssets.includes(intent.asset) || intent.chainId !== appConfig.chainId) throw new Error("Unsupported asset or network.");
  if (!Number.isFinite(intent.amount) || intent.amount <= 0 || intent.amount > 1_000_000_000) throw new Error("Enter a valid funding amount.");
  if (intent.type !== "deposit" && intent.type !== "withdrawal") throw new Error("Unsupported funding action.");
  if (intent.type === "withdrawal") {
    if (!intent.destination || !/^0x[a-fA-F0-9]{40}$/.test(intent.destination)) throw new Error("Enter a valid destination address.");
    if ((current.balances[intent.asset] ?? 0) < intent.amount) throw new Error("Insufficient available balance.");
  }
  current.balances[intent.asset] = round((current.balances[intent.asset] ?? 0) + (intent.type === "deposit" ? intent.amount : -intent.amount));
  current.fundedRequests.push(requestId);
  current.fundingIntents ??= {};
  current.fundingIntents[requestId] = signature;
  ledger(intent.type, intent.amount, intent.asset);
  event(intent.type, (intent.type === "deposit" ? "Paper deposit confirmed" : "Paper withdrawal simulated"), intent.amount + " " + intent.asset + " · " + appConfig.chainName, intent.type === "deposit" ? intent.amount : -intent.amount);
  save();
  return intent.type === "deposit" ? "Paper funds added to your balance." : "Paper funds deducted from your balance.";
}

export function paperComments(marketId: string): MarketComment[] {
  const current = state();
  const comments = (current.comments ?? []).filter((comment) => comment.marketId === marketId);
  return comments.map((comment) => ({
    ...comment,
    viewerUseful: Boolean(current.useful?.[comment.id]),
    replyCount: comment.replyCount + comments.filter((reply) => reply.replyToId === comment.id).length
  }));
}
export function paperUseful(id: string): boolean { return Boolean(state().useful?.[id]); }
export function paperReplyCount(id: string): number { return (state().comments ?? []).filter((comment) => comment.replyToId === id).length; }
export function addPaperComment(input: MarketCommentInput): MarketComment {
  if (!paperMarkets().some((market) => market.id === input.marketId)) throw new Error("Market not found.");
  const body = input.body.trim();
  if (!body || body.length > 280) throw new Error("Comments must contain 1 to 280 characters.");
  const comment: MarketComment = {
    id: "comment-paper-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    marketId: input.marketId, authorHandle: "papertrader", authorDisplayName: "Paper Trader",
    initials: "PT", body, createdAt: new Date().toISOString(), usefulCount: 0,
    replyCount: 0, replyToId: input.replyToId
  };
  const current = state();
  current.comments ??= [];
  current.comments.unshift(comment);
  save();
  return { ...comment };
}
export function setPaperUseful(id: string, useful: boolean): void {
  const current = state();
  current.useful ??= {};
  current.useful[id] = useful;
  save();
}

export function resetPaperExchange() {
  cache = initialState();
  save();
}

export function seedPaperExchangeForTests() {
  cache = initialState();
}
