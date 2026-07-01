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

import { getItem } from './items';

function normalizeItemType(itemType: string): string {
  const type = itemType.toLowerCase();
  if (type === 'cooked_fish_meat') return 'cooked fish';
  if (type === 'tool_axe') return 'axe';
  if (type === 'tool_axe_l2') return 'axe lv.2';
  if (type === 'tool_pickaxe') return 'pickaxe';
  if (type === 'tool_pickaxe_l2') return 'pickaxe lv.2';
  if (type === 'wild_sword') return 'wild sword';
  return type.replace(/_/g, ' ');
}

export async function fetchMarketplaceListings(): Promise<MarketplaceListing[]> {
  try {
    const res = await fetch('https://fanout.kintara.gg/api/marketplace/listings?sort=latest&currency=all&category=all&limit=60&offset=0', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 30 } // Cache for 30s
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch marketplace listings: status ${res.status}`);
    }
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.listings)) {
      return [];
    }

    return data.listings.map((item: any) => {
      const normalized = normalizeItemType(item.itemType);
      const gameItem = getItem(normalized);
      const isToken = item.currency === 'token';
      const isGold = item.currency === 'gold';
      const price = Number(item.priceGold) || 0;
      
      const totalPriceKins = isToken ? price : undefined;
      const totalPriceGold = isGold ? price : undefined;
      const quantity = Number(item.quantity) || 1;

      return {
        id: String(item.id),
        source: 'kintara',
        status: 'active',
        sellerName: item.sellerName || 'Unknown',
        sellerWallet: item.sellerId ? String(item.sellerId) : undefined,
        itemId: gameItem.id !== 'unknown' ? gameItem.id : normalized,
        itemName: gameItem.id !== 'unknown' ? gameItem.name : normalized.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        itemCategory: gameItem.category !== 'Unknown' ? gameItem.category : 'Unknown',
        rarity: gameItem.rarity || 'Common',
        quantity,
        totalPriceKins,
        totalPriceGold,
        pricePerItemKins: totalPriceKins ? totalPriceKins / quantity : undefined,
        pricePerItemGold: totalPriceGold ? totalPriceGold / quantity : undefined,
        totalPriceUsd: item.priceUsd ? Number(item.priceUsd) : undefined,
        iconUrl: gameItem.emoji || '📦',
        listedAt: item.createdAt || new Date().toISOString(),
        verified: true
      };
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return [];
  }
}

export async function fetchActiveOrders(wallet: string, sellerName?: string): Promise<MarketplaceListing[]> {
  try {
    const listings = await fetchMarketplaceListings();
    if (!sellerName) return [];
    return listings.filter(l => l.sellerName?.toLowerCase() === sellerName.toLowerCase());
  } catch {
    return [];
  }
}

