// ─── Shared TypeScript types for Kintara Ledger ───────────────────────────────

export type Transfer = {
  date: string;          // ISO string
  direction: 'in' | 'out';
  amount: number;        // KINS
  counterparty: string;
  signature: string;
  solscan: string;
  timestamp: number;     // Unix seconds
};

export type EnrichedTransfer = Transfer & {
  kinsPriceAtTx: number | null;   // USD per KINS at tx time
  txUsdValue: number | null;      // amount * kinsPriceAtTx
  priceSource: 'historical' | 'current' | 'unavailable';
};

export type Counterparty = {
  address: string;
  in: number;     // KINS received from this address
  out: number;    // KINS sent to this address
  count: number;
  net: number;
  firstSeen: string;  // ISO
  lastSeen: string;   // ISO
};

export type Summary = {
  totalTransfersChecked: number;
  kinsTransfers: number;
  buyCount: number;
  sellCount: number;
  totalBuyKins: number;
  totalSellKins: number;
  netKins: number;
};

export type Analysis = {
  wallet: string;
  kinsMint: string;
  filteredByMarketplaceCounterparties: boolean;
  summary: Summary;
  counterparties: Counterparty[];
  transfers: Transfer[];
};

export type KinsPrice = {
  priceUsd: number;
  priceNative: string;
  liquidityUsd: number;
  fdv: number;
  marketCap: number | null;
  volume24h: number;
  priceChange24h: number;
  dexId: string;
  pairAddress: string;
  pairUrl: string;
  tokenName: string;
  tokenSymbol: string;
  lastUpdated: string;
};

// OHLCV candle [timestamp_sec, open, high, low, close, volume]
export type OhlcvCandle = {
  date: string;   // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type HistoricalPriceResponse = {
  priceMap: Record<string, number | null>;  // YYYY-MM-DD → USD price
  ohlcv: OhlcvCandle[];
};

export type PnlSummary = {
  totalBuyKins: number;
  totalBuyUsd: number | null;
  totalSellKins: number;
  totalSellUsd: number | null;
  realizedProfitUsd: number | null;
  netKins: number;
  roiPercent: number | null;
  currentHoldingUsd: number | null;
  hasHistoricalPrices: boolean;
};

export type Tab = 'overview' | 'trades' | 'orders' | 'resources' | 'counterparties' | 'price' | 'settings';

export type AppState = {
  wallet: string;
  analysis: Analysis | null;
  enriched: EnrichedTransfer[];
  pnl: PnlSummary | null;
  kinsPrice: KinsPrice | null;
  ohlcv: OhlcvCandle[];
  loading: boolean;
  priceLoading: boolean;
  error: string;
  tab: Tab;
  maxPages: number;
};
