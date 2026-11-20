import type { AccountBalance, ActivityItem, AdminMarketInput, AdminUser, FundingIntent, Market, MarketComment, MarketCommentInput, MarketStatus, OrderBookLevel, OrderIntent, OrderPreview, Position, RecentTrade, ResolutionCase, TransactionRecord, UserOrder } from "@/core/contracts/domain";
import { appConfig } from "@/lib/config";
import { activity as seedActivity, adminUsers as seedAdminUsers, markets, orders as seedOrders, positions as seedPositions, resolutions as seedResolutions, transactions as seedTransactions } from "./data";

/**
 * A browser-local paper exchange with finite synthetic counterparty depth, NOT a real exchange or wallet.
 * Every command is synchronous and explicitly confirmed after the reference wallet
 * approves it. State belongs to the browser only; static server renders stay pure.
 */
const KEY = "opinny-paper-exchange-v1";
const FEE_RATE = 0.001;
type PaperOrder = UserOrder & { marketId?: string; outcomeId?: string; reservedCollateral?: number; intentFingerprint?: string };
type PaperTrade = RecentTrade & { marketId: string; createdAt?: string };
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
  consumedDepth?: Record<string, number>;
  lastPrices?: Record<string, number>;
  priceHistory?: Record<string, { at: string; price: number }[]>;
  rewardEarnings?: Record<string, number>;
  journal?: PaperJournalEntry[];
  revision?: number;
};
export type PaperJournalEntry = {
  id: string;
  at: string;
  kind: "fill" | "reserve" | "release" | "funding" | "redeem" | "reward";
  cashDelta: number;
  lockedDelta: number;
  fee: number;
  asset: string;
  marketId?: string;
  orderId?: string;
};
let cacheRevision = 0;
let storageListenerAdded = false;
let cache: PaperState | null = null;

const round = (n: number) => Math.round((n + Number.EPSILON) * 1_000_000) / 1_000_000;
/** An idempotency key must never silently authorize a different order intent. */
const fingerprintOrder = (intent: OrderIntent) => JSON.stringify([
  intent.marketId, intent.outcomeId, intent.side, intent.type,
  intent.collateralAmount ?? null, intent.shares ?? null,
  intent.limitPrice ?? null, intent.maxSlippageBps ?? null
]);
const active = (order: PaperOrder) => order.status === "open" || order.status === "partially-filled";
const remaining = (order: PaperOrder) => Math.max(0, order.shares - order.filled);
/** All admin writes are local sandbox state; production authorization lives elsewhere. */
export function paperMarkets(): Market[] {
  const current = state();
  return [...(current.createdMarkets ?? []), ...markets].map((market) => {
    const resolved = current.resolvedMarkets?.[market.id];
    const prices = current.lastPrices ?? {};
    const history = current.priceHistory?.[market.id] ?? [];
    return {
      ...market,
      status: resolved ? "resolved" : (current.marketStatuses?.[market.id] ?? market.status) === "open" && Date.parse(market.endDate) <= Date.now() ? "paused" : current.marketStatuses?.[market.id] ?? market.status,
      outcomes: market.outcomes.map((outcome) => ({
        ...outcome,
        probability: resolved ? (resolved === outcome.id ? 100 : 0) : round((prices[market.id + "|" + outcome.id] ?? outcome.probability / 100) * 100),
        change24h: resolved ? 0 : round(((prices[market.id + "|" + outcome.id] ?? outcome.probability / 100) * 100) - outcome.probability)
      })),
      chart: [...market.chart, ...history.map((point) => point.price)].slice(-160),
      volume: round(market.volume + current.trades.filter((trade) => trade.marketId === market.id).reduce((sum, trade) => sum + trade.value, 0)),
      volume24h: round(market.volume24h + current.trades.filter((trade) => trade.marketId === market.id && Date.now() - Date.parse(trade.createdAt ?? "") < 86_400_000).reduce((sum, trade) => sum + trade.value, 0))
    };
  });
}

export function paperAdminUsers(): AdminUser[] {
  return seedAdminUsers.map((user) => ({ ...user, status: state().userStatuses?.[user.id] ?? user.status }));
}
export function paperResolutionCases(): ResolutionCase[] {
  const current = state();
  const bundledWithExplicitCases = new Set(seedResolutions.map((item) => item.marketId));
  const operationalMarkets = [
    ...(current.createdMarkets ?? []).filter((market) => (current.marketStatuses?.[market.id] ?? market.status) !== "draft"),
    ...markets.filter((market) => !bundledWithExplicitCases.has(market.id))
  ];
  const dynamicCases = operationalMarkets.map((market): ResolutionCase => {
    const caseId = "paper-case-" + market.id;
    const resolved = current.resolvedMarkets?.[market.id];
    const winner = resolved ? market.outcomes.find((item) => item.id === resolved) : undefined;
    return {
      id: caseId, marketId: market.id, market: market.shortQuestion,
      endDate: market.endDate.slice(0, 10),
      proposedOutcome: winner?.label ?? market.outcomes[0]?.label ?? "",
      source: market.resolutionSource, disputes: 0,
      status: resolved || market.status === "resolved" ? "approved" : "awaiting"
    };
  });
  return [...dynamicCases, ...seedResolutions].map((item) => {
    const decision = current.resolutionDecisions?.[item.id];
    const resolved = item.marketId && current.resolvedMarkets?.[item.marketId];
    return {
      ...item,
      status: resolved ? "approved" : decision?.status ?? item.status,
      proposedOutcome: decision?.outcome ?? item.proposedOutcome
    };
  });
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
  const linked = paperMarkets().find((market) => item.marketId ? market.id === item.marketId : market.question === item.market || market.shortQuestion === item.market);
  if (!linked) throw new Error("This resolution case has no paper market to settle.");
  if (!linked.outcomes.some((candidate) => candidate.label === outcome || candidate.id === outcome)) throw new Error("The selected outcome does not belong to this market.");
  settlePaperMarket(linked.id, outcome);
  state().resolutionDecisions ??= {};
  state().resolutionDecisions![id] = { status: "approved", outcome };
  event("resolution", "Paper case approved", item.market + " · " + outcome);
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
      addJournal("release", order.reservedCollateral ?? 0, -(order.reservedCollateral ?? 0), 0, marketId, order.id);
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
    resolvedMarkets: {},
    consumedDepth: {},
    lastPrices: {},
    priceHistory: {},
    rewardEarnings: {},
    journal: [],
    revision: 0
  };
}

function state(): PaperState {
  if (typeof window !== "undefined" && !storageListenerAdded) {
    window.addEventListener("storage", (event) => {
      if (event.key !== KEY) return;
      cache = null;
      window.dispatchEvent(new CustomEvent("opinny:paper-update"));
    });
    storageListenerAdded = true;
  }
  if (cache) return cache;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          const data = saved as Partial<PaperState>;
          if (data.version === 1 && data.balances && Array.isArray(data.positions) && Array.isArray(data.orders) && Array.isArray(data.activity) && Array.isArray(data.trades) && Array.isArray(data.fundedRequests)
            && Object.values(data.balances).every((amount) => Number.isFinite(amount) && amount >= 0)) {
            cache = data as PaperState;
            cacheRevision = data.revision ?? 0;
            return cache;
          }
        }
      }
    } catch { /* Recover from malformed data or disabled storage using a temporary account. */ }
  }
  cacheRevision = 0;
  cache = initialState();
  return cache;
}

function save() {
  const current = state();
  if (typeof window !== "undefined") {
    try {
      const previous = window.localStorage.getItem(KEY);
      const savedRevision = previous ? (JSON.parse(previous) as Partial<PaperState>).revision ?? 0 : 0;
      if (savedRevision !== cacheRevision) {
        cache = null;
        throw new Error("Your paper account changed in another tab. Reload the latest state and retry.");
      }
      const nextRevision = cacheRevision + 1;
      const next = { ...current, revision: nextRevision };
      window.localStorage.setItem(KEY, JSON.stringify(next));
      current.revision = nextRevision;
      cacheRevision = nextRevision;
    } catch (error) {
      if (error instanceof Error && error.message.includes("another tab")) throw error;
      // Restricted browser storage leaves this run ephemeral; no persistence is claimed.
    }
    window.dispatchEvent(new CustomEvent("opinny:paper-update"));
  }
}

function addJournal(kind: PaperJournalEntry["kind"], cashDelta: number, lockedDelta = 0, fee = 0, marketId?: string, orderId?: string, asset = appConfig.collateral) {
  const current = state();
  current.journal ??= [];
  current.journal.unshift({
    id: "journal-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9),
    at: new Date().toISOString(), kind,
    cashDelta: round(cashDelta), lockedDelta: round(lockedDelta), fee: round(fee), marketId, orderId, asset
  });
}
export const paperJournal = (): PaperJournalEntry[] => [...(state().journal ?? [])].map((entry) => ({ ...entry }));
export const paperRewardEarnings = (marketId: string): number => round(state().rewardEarnings?.[marketId] ?? 0);
export const paperAllTrades = (): PaperTrade[] => state().trades.map((trade) => ({ ...trade }));


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
function setLastPrice(market: Market, label: string, tradedPrice: number) {
  const current = state();
  current.lastPrices ??= {};
  current.priceHistory ??= {};
  const target = market.outcomes.find((item) => item.label === label);
  if (!target) return;
  const price = Math.max(0.01, Math.min(0.99, round(tradedPrice)));
  current.lastPrices[market.id + "|" + target.id] = price;
  const others = market.outcomes.filter((item) => item.id !== target.id);
  const othersTotal = others.reduce((sum, item) => sum + (current.lastPrices?.[market.id + "|" + item.id] ?? item.probability / 100), 0);
  others.forEach((item, index) => {
    current.lastPrices![market.id + "|" + item.id] = round(index === others.length - 1
      ? Math.max(0, 1 - price - others.slice(0, index).reduce((sum, preceding) => sum + (current.lastPrices?.[market.id + "|" + preceding.id] ?? 0), 0))
      : (1 - price) * (current.lastPrices?.[market.id + "|" + item.id] ?? item.probability / 100) / Math.max(othersTotal, 0.000001));
  });
  const firstId = market.outcomes[0]?.id;
  if (firstId) {
    current.priceHistory[market.id] ??= [];
    current.priceHistory[market.id].push({ at: new Date().toISOString(), price: round((current.lastPrices[market.id + "|" + firstId] ?? 0.5) * 100) });
    current.priceHistory[market.id] = current.priceHistory[market.id].slice(-160);
  }
}
function recordTrade(market: Market, side: "buy" | "sell", label: string, price: number, quantity: number, orderId?: string, fromReserve = false) {
  const fee = round(price * quantity * FEE_RATE);
  state().trades.unshift({
    id: "trade-paper-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), marketId: market.id, side, outcome: label,
    price, shares: quantity, value: round(price * quantity), trader: "You · paper", time: "Now", createdAt: new Date().toISOString()
  });
  state().trades = state().trades.slice(0, 500);
  setLastPrice(market, label, price);
  addJournal("fill", side === "buy" ? (fromReserve ? 0 : -round(price * quantity + fee)) : round(price * quantity - fee), side === "buy" && fromReserve ? -round(price * quantity + fee) : 0, fee, market.id, orderId);
  ledger("trade", price * quantity);
  event("trade", (side === "buy" ? "Bought " : "Sold ") + round(quantity).toLocaleString() + " " + label + " shares", market.shortQuestion, side === "buy" ? -round(price * quantity + fee) : round(price * quantity - fee));
}

/** Deterministic virtual counterparties, not user-to-user matching. Every fill consumes displayed depth. */
function referenceLevels(marketId: string, outcomeId: string, side: "buy" | "sell") {
  const source = [...(state().createdMarkets ?? []), ...markets].find((item) => item.id === marketId);
  const outcome = source?.outcomes.find((item) => item.id === outcomeId);
  if (!outcome || state().resolvedMarkets?.[marketId]) return [];
  const quote = outcome.probability / 100;
  return [1200, 2400, 3100, 5800].map((initialSize, tier) => {
    const price = round(Math.min(0.99, Math.max(0.01, quote + (side === "buy" ? -1 : 1) * (tier + 1) / 100)));
    const key = marketId + "|" + outcomeId + "|" + side + "|" + tier;
    return { price, size: round(Math.max(0, initialSize - (state().consumedDepth?.[key] ?? 0))), tier, key };
  }).filter((level) => level.size > 0);
}
function floorShares(value: number): number {
  return Math.floor((value + 1e-10) * 1_000_000) / 1_000_000;
}
function planOrder(intent: OrderIntent) {
  const market = marketFor(intent.marketId);
  const outcome = opening(market.id, intent.outcomeId);
  if (!outcome || outcome.probability <= 0 || outcome.probability >= 100) throw new Error("This outcome cannot be traded.");
  if (intent.type !== "market" && intent.type !== "limit") throw new Error("Unsupported order type.");
  if (intent.side !== "buy" && intent.side !== "sell") throw new Error("Unsupported trade direction.");
  if (!intent.clientRequestId.trim()) throw new Error("Order request ID is required.");
  const limit = intent.limitPrice ?? 0;
  if (intent.type === "limit" && (!Number.isFinite(limit) || limit < 0.01 || limit > 0.99)) throw new Error("Limit price must be between 1¢ and 99¢.");
  const buy = intent.side === "buy";
  const budget = intent.collateralAmount ?? 0;
  const shares = intent.shares ?? 0;
  if (buy && (!Number.isFinite(budget) || budget <= 0 || budget > 1_000_000_000)) throw new Error("Enter a valid collateral amount.");
  if (!buy && (!Number.isFinite(shares) || shares <= 0 || shares > 1_000_000_000)) throw new Error("Enter a valid number of shares.");
  if (buy && budget > (state().balances[appConfig.collateral] ?? 0) + 1e-6) throw new Error("Insufficient available " + appConfig.collateral + " balance.");
  if (!buy && shares > freeShares(market.id, outcome.label) + 1e-6) throw new Error("Insufficient unreserved " + outcome.label + " shares.");
  const totalShares = buy && intent.type === "limit" ? floorShares(budget / (limit * (1 + FEE_RATE))) : buy ? 0 : floorShares(shares);
  let leftShares = totalShares;
  let leftBudget = budget;
  let filledShares = 0;
  let spent = 0;
  let fee = 0;
  const fills: { price: number; shares: number; key: string }[] = [];
  for (const level of referenceLevels(market.id, outcome.id, buy ? "sell" : "buy")) {
    if (intent.type === "limit" && (buy ? level.price > limit + 1e-9 : level.price < limit - 1e-9)) break;
    const capacity = buy ? (intent.type === "limit" ? leftShares : floorShares(leftBudget / (level.price * (1 + FEE_RATE)))) : leftShares;
    const quantity = floorShares(Math.min(level.size, capacity));
    if (quantity < 0.000001) continue;
    const notional = round(quantity * level.price);
    const fillFee = round(notional * FEE_RATE);
    if (buy && notional + fillFee > leftBudget + 1e-6) continue;
    fills.push({ price: level.price, shares: quantity, key: level.key });
    filledShares = round(filledShares + quantity);
    spent = round(spent + notional);
    fee = round(fee + fillFee);
    if (buy) {
      leftBudget = round(Math.max(0, leftBudget - notional - fillFee));
      if (intent.type === "limit") leftShares = round(Math.max(0, leftShares - quantity));
    } else leftShares = round(Math.max(0, leftShares - quantity));
  }
  if (intent.type === "market" && (filledShares <= 0 || (!buy && leftShares > 0.000001) || (buy && leftBudget > 0.01 && fills.length === referenceLevels(market.id, outcome.id, "sell").length))) {
    throw new Error("Not enough simulated order-book depth for this market order. Reduce the size or use a limit order.");
  }
  if (buy && intent.type === "limit" && totalShares <= 0) throw new Error("Order size is too small.");
  const remainingShares = intent.type === "market" ? 0 : round(Math.max(0, totalShares - filledShares));
  const finalShares = buy && intent.type === "market" ? filledShares : totalShares;
  const quote = outcome.probability / 100;
  const average = filledShares ? spent / filledShares : intent.type === "limit" ? limit : quote;
  // Quoted bid/ask spread is not slippage; count only additional price movement through depth.
  const best = referenceLevels(market.id, outcome.id, buy ? "sell" : "buy")[0]?.price ?? quote;
  // A single price level has zero price impact; avoid false nonzero bps from rounding.
  const impactBps = fills.length <= 1 ? 0 : Math.max(0, round((buy ? average - best : best - average) / best * 10000));
  if (Number.isFinite(intent.maxSlippageBps) && intent.maxSlippageBps !== undefined && impactBps > intent.maxSlippageBps) throw new Error("Simulated slippage exceeds the selected maximum.");
  const reserve = buy && intent.type === "limit" ? round(remainingShares * limit * (1 + FEE_RATE)) : 0;
  if (buy && spent + fee + reserve > budget + 0.000001) throw new Error("Order exceeds available collateral.");
  const preview: OrderPreview = {
    estimatedPrice: round(average), estimatedShares: round(finalShares),
    estimatedCollateral: round(spent + (buy ? remainingShares * limit : 0)),
    estimatedFee: round(fee + (buy ? remainingShares * limit * FEE_RATE : 0)),
    estimatedPayout: buy ? round(finalShares) : round(spent - fee + remainingShares * (intent.type === "limit" ? limit * (1 - FEE_RATE) : 0)),
    priceImpactBps: impactBps
  };
  return { market, outcome, fills, preview, totalShares: round(finalShares), filledShares, remainingShares, reserve, spent, fee };
}

export function previewPaperOrder(intent: OrderIntent): OrderPreview {
  return planOrder(intent).preview;
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

/** Visible simulated depth and execution share the same finite reference liquidity. */
export function paperOrderBook(marketId: string, outcomeId: string): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const outcome = opening(marketId, outcomeId);
  if (!outcome) return { bids: [], asks: [] };
  function build(side: "buy" | "sell"): OrderBookLevel[] {
    const offers = referenceLevels(marketId, outcomeId, side).map(({ price, size }) => ({ price, size }));
    // The user's resting orders are shown separately. Never display self-liquidity as executable counterparty depth.
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
  const intentFingerprint = fingerprintOrder(intent);
  if (existing) {
    if (existing.intentFingerprint && existing.intentFingerprint !== intentFingerprint) {
      throw new Error("This order request ID was already used for a different trade.");
    }
    return existing.status === "filled" ? "Order already filled." : "Order already placed.";
  }
  const plan = planOrder(intent);
  const { market, outcome, fills, filledShares, remainingShares, reserve, spent, fee, preview } = plan;
  const filled = remainingShares < 0.000001;
  const order: PaperOrder = {
    id: intent.clientRequestId, marketId: market.id, outcomeId: outcome.id,
    marketSlug: market.slug, marketQuestion: market.shortQuestion, outcome: outcome.label,
    side: intent.side, type: intent.type, price: intent.type === "limit" ? intent.limitPrice! : preview.estimatedPrice,
    shares: plan.totalShares, filled: filledShares,
    status: filled ? "filled" : filledShares ? "partially-filled" : "open",
    createdAt: new Date().toISOString(), reservedCollateral: reserve, intentFingerprint
  };
  current.orders.unshift(order);
  if (intent.side === "buy") {
    current.balances[appConfig.collateral] = round((current.balances[appConfig.collateral] ?? 0) - spent - fee - reserve);
    for (const fill of fills) creditShares(market, outcome.label, fill.price, fill.shares);
    if (reserve) addJournal("reserve", -reserve, reserve, 0, market.id, order.id);
  } else {
    for (const fill of fills) debitShares(market.id, outcome.label, fill.shares);
    current.balances[appConfig.collateral] = round((current.balances[appConfig.collateral] ?? 0) + spent - fee);
  }
  for (const fill of fills) {
    current.consumedDepth ??= {};
    current.consumedDepth[fill.key] = round((current.consumedDepth[fill.key] ?? 0) + fill.shares);
    recordTrade(market, intent.side, outcome.label, fill.price, fill.shares, order.id);
  }
  if (!filled) event("trade", "Limit order posted", market.shortQuestion + " · " + outcome.label + " at " + Math.round(order.price * 100) + "¢");
  save();
  return filled ? "Paper trade filled against simulated book depth." : filledShares ? "Partially filled; remainder posted as a limit order." : "Limit order posted. Funds or shares are reserved until filled or cancelled.";
}

export function cancelPaperOrder(id: string): string {
  const order = state().orders.find((item) => item.id === id);
  if (!order) throw new Error("Order was not found.");
  if (!active(order)) throw new Error("Only open orders can be cancelled.");
  if (order.side === "buy") {
    state().balances[appConfig.collateral] = round((state().balances[appConfig.collateral] ?? 0) + (order.reservedCollateral ?? 0));
    addJournal("release", order.reservedCollateral ?? 0, -(order.reservedCollateral ?? 0), 0, order.marketId, order.id);
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
    addJournal("release", order.reservedCollateral, -order.reservedCollateral, 0, market.id, order.id);
    order.reservedCollateral = 0;
  }
  recordTrade(market, order.side, order.outcome, order.price, finalQuantity, order.id, order.side === "buy");
  const referencePrice = [...(state().createdMarkets ?? []), ...markets].find((item) => item.id === market.id)?.outcomes.find((item) => item.label === order.outcome)?.probability ?? 50;
  if (Math.abs(order.price * 100 - referencePrice) <= 3 && finalQuantity >= 20) {
    const reward = round(finalQuantity * 0.0005);
    current.rewardEarnings ??= {};
    current.rewardEarnings[market.id] = round((current.rewardEarnings[market.id] ?? 0) + reward);
    current.balances[appConfig.collateral] = round((current.balances[appConfig.collateral] ?? 0) + reward);
    addJournal("reward", reward, 0, 0, market.id, order.id);
    ledger("reward", reward);
    event("reward", "Paper liquidity incentive", market.shortQuestion, reward);
  }
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
  addJournal("redeem", amount, 0, 0, position.marketId);
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
  addJournal("funding", intent.type === "deposit" ? intent.amount : -intent.amount, 0, 0, undefined, undefined, intent.asset);
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
  // Reset is a deliberate write based on the latest persisted revision.
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      cacheRevision = raw ? (JSON.parse(raw) as Partial<PaperState>).revision ?? 0 : 0;
    } catch { cacheRevision = 0; }
  }
  cache = initialState();
  save();
}

export function seedPaperExchangeForTests() {
  cacheRevision = 0;
  cache = initialState();
}
