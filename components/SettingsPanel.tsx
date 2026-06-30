'use client';

type Props = {
  maxPages: number;
  setMaxPages: (n: number) => void;
  kinsMint?: string;
  filtered?: boolean;
  kinsPrice?: { priceUsd: number } | null;
};

export function SettingsPanel({ maxPages, setMaxPages, kinsMint, filtered, kinsPrice }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Settings</span>
      </div>

      <div className="s-rows">
        {/* Scan depth */}
        <div className="s-row">
          <div className="s-label">Pages to Scan</div>
          <div className="s-desc">
            Each page fetches up to 100 parsed transactions from Helius. Max 50 pages (5,000 txs).
          </div>
          <input
            className="s-input"
            type="number" min={1} max={50}
            value={maxPages}
            onChange={(e) => setMaxPages(Math.min(50, Math.max(1, Number(e.target.value))))}
          />
        </div>

        {/* KINS mint */}
        <div className="s-row">
          <div className="s-label">KINS Mint Address</div>
          <div className="s-desc">SPL token mint used to identify KINS transfers on Solana.</div>
          <code className="s-mono">{kinsMint || 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump'}</code>
        </div>

        {/* API status */}
        <div className="s-row">
          <div className="s-label">Data Source Status</div>
          <div className="s-status-grid">
            <div className="s-status-row">
              <span className="status-dot dot-green" />
              <span>Helius API — configured via .env.local (server-side only)</span>
            </div>
            <div className="s-status-row">
              <span className={`status-dot ${kinsPrice ? 'dot-green' : 'dot-amber'}`} />
              <span>DexScreener API — {kinsPrice ? 'connected' : 'not fetched'}</span>
            </div>
            <div className="s-status-row">
              <span className="status-dot dot-amber" />
              <span>GeckoTerminal OHLCV — queried on analysis (historical prices)</span>
            </div>
            <div className="s-status-row">
              <span className="status-dot dot-red" />
              <span>Marketplace API — not found (listings unavailable)</span>
            </div>
            <div className="s-status-row">
              <span className="status-dot dot-red" />
              <span>Seller Wallet Mapping — not available</span>
            </div>
            <div className="s-status-row">
              <span className="status-dot dot-green" />
              <span>Kintara Docs/Assets — loaded pixel fallbacks</span>
            </div>
          </div>
        </div>

        {/* Marketplace filter */}
        <div className="s-row">
          <div className="s-label">Marketplace Counterparty Filter</div>
          <div className="s-desc">
            {filtered
              ? '✅ Active — only KINS transfers with marketplace/escrow counterparties are counted.'
              : '⚪ Off — all KINS transfers scanned. Set KINTARA_MARKETPLACE_COUNTERPARTIES in .env.local to filter marketplace-only trades.'}
          </div>
          <code className="s-mono s-mono-sm">KINTARA_MARKETPLACE_COUNTERPARTIES=addr1,addr2</code>
        </div>

        {/* Limitations */}
        <div className="s-row">
          <div className="s-label">Known Limitations</div>
          <div className="s-desc">
            Exact item names and active sell orders require marketplace metadata, public listing API, seller wallet mapping, or on-chain marketplace escrow/program data. Wallet transfers alone can only calculate KINS in/out.
          </div>
        </div>

        {/* Security */}
        <div className="s-row">
          <div className="s-label">Security</div>
          <div className="s-desc">
            🔒 <strong>HELIUS_API_KEY</strong> is stored in <code>.env.local</code> and used exclusively
            in server-side API routes. It is never included in browser bundles or client code.
            Only public Solana wallet addresses are required — no seed phrase or private key.
          </div>
        </div>
      </div>
    </div>
  );
}
