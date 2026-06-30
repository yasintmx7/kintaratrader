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
          <div className="s-label">API Status</div>
          <div className="s-status-grid">
            <div className="s-status-row">
              <span className="status-dot dot-green" />
              <span>Helius Enhanced API — configured via .env.local (server-side only)</span>
            </div>
            <div className="s-status-row">
              <span className={`status-dot ${kinsPrice ? 'dot-green' : 'dot-amber'}`} />
              <span>DexScreener price API — {kinsPrice ? 'connected' : 'not yet fetched'}</span>
            </div>
            <div className="s-status-row">
              <span className="status-dot dot-amber" />
              <span>GeckoTerminal OHLCV — queried on analysis (historical prices)</span>
            </div>
            <div className="s-status-row">
              <span className="status-dot dot-red" />
              <span>Kintara marketplace API — not configured (active orders unavailable)</span>
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
            Wallet transfers can calculate KINS in/out and estimated USD P/L using DexScreener + GeckoTerminal.
            The following require additional data sources:
          </div>
          <div className="req-list" style={{ marginTop: 8 }}>
            <div className="req-item">
              <span className="req-dot">▸</span>
              <span><strong>Exact item names</strong> — require Kintara marketplace metadata API</span>
            </div>
            <div className="req-item">
              <span className="req-dot">▸</span>
              <span><strong>Active sell orders</strong> — require marketplace API or escrow program scanning</span>
            </div>
            <div className="req-item">
              <span className="req-dot">▸</span>
              <span><strong>Historical prices before GeckoTerminal coverage</strong> — marked as "current" fallback</span>
            </div>
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
