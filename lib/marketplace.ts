export type MarketplaceListing = {
  id: string;
  source: "kintara" | "kintrade" | "onchain" | "manual";
  status: "active" | "sold" | "cancelled" | "unknown";
  sellerWallet?: string;
  sellerName?: string;
  itemId?: string;
  itemName: string;
  itemCategory?: string;
  rarity?: string;
  quantity: number;
  totalPriceKins?: number;
  totalPriceGold?: number;
  pricePerItemKins?: number;
  pricePerItemGold?: number;
  totalPriceUsd?: number;
  iconUrl?: string;
  listedAt?: string;
  updatedAt?: string;
  marketplaceUrl?: string;
  solscanUrl?: string;
  verified: boolean;
};

// Honest mock functions indicating no active data source is plugged in yet

export async function fetchMarketplaceListings(): Promise<MarketplaceListing[]> {
  // Returns empty array because we don't have a configured API key or endpoint yet.
  return [];
}

export async function fetchActiveOrders(wallet: string): Promise<MarketplaceListing[]> {
  // Wallet specific listings
  return [];
}
