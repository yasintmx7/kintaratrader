'use client';

import { MarketplaceListing } from '@/lib/marketplace';
import { EmptyState } from './EmptyState';

export function ActiveOrdersTable({ orders }: { orders: MarketplaceListing[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No Active Orders Found"
        body="Active orders require a marketplace seller mapping. Either the mapping is missing or you currently have zero active orders."
      />
    );
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Total Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.itemName}</td>
              <td className="td-mono">{o.quantity}</td>
              <td className="td-mono">{o.currency === 'token' ? `${o.priceGold} KINS` : `${o.priceGold} Gold`}</td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
