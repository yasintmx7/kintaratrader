'use client';

import { EmptyState } from './EmptyState';

type Props = {
  wallet: string;
};

export function ActiveOrdersTab({ wallet }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Active Sell Orders</span>
        <span className="badge-sm">0 listings</span>
      </div>

      <EmptyState
        icon="📋"
        title="Active marketplace listings could not be verified"
        body="Active sell orders cannot be determined from wallet token transfers alone. To display live active listings the following is required:"
        note={`Configured marketplace API or escrow addresses would be used to check listings for: ${wallet.slice(0, 8)}…`}
      >
        <div className="req-list">
          <div className="req-item">
            <span className="req-dot">▸</span>
            <span>
              <strong>Kintara marketplace public API</strong> — a public endpoint listing active orders
            </span>
          </div>
          <div className="req-item">
            <span className="req-dot">▸</span>
            <span>
              <strong>Marketplace counterparty / escrow addresses</strong> — set{' '}
              <code>KINTARA_MARKETPLACE_COUNTERPARTIES</code> in Settings
            </span>
          </div>
          <div className="req-item">
            <span className="req-dot">▸</span>
            <span>
              <strong>Marketplace program ID</strong> — set{' '}
              <code>KINTARA_ESCROW_PROGRAM_ID</code> in Settings for on-chain account scanning
            </span>
          </div>
          <div className="req-item">
            <span className="req-dot">▸</span>
            <span>
              <strong>Sub-graph or indexer</strong> — indexer that tracks Kintara marketplace escrow accounts
            </span>
          </div>
        </div>
      </EmptyState>
    </div>
  );
}
