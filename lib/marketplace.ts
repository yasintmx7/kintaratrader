export type MarketplaceListing = {
  id: string;
  sellerId?: string;
  sellerName?: string;
  itemName: string;
  itemType: string;
  quantity: number;
  priceGold?: number;
  priceUsd?: number;
  currency: string;
  createdAt?: string;
  reservedBy?: string | null;
  reservedUntilMs?: number | null;
  itemDurability?: number | null;
  status: "available" | "locked" | "available_expired_lock";
  isReserved: boolean;
  unlocksInMs: number;
  unlocksAt: string;
  pricePerItemUsd?: number;
  pricePerItemGold?: number;
  source: "kintara" | "kintrade" | "onchain" | "manual";
  verified: boolean;
  itemCategory?: string;
  rarity?: string;
  iconUrl?: string;
  sellerWallet?: string;
};

import { getItem } from './items';

export function formatItemType(itemType: string): string {
  if (!itemType) return 'Unknown Item';
  
  let name = itemType.toLowerCase();
  
  // Custom manual mappings
  if (name === 'cooked_fish_meat') return 'Cooked Fish';
  if (name === 'mount_octopus') return 'Octopus Mount';
  
  // Strip prefixes
  if (name.startsWith('tool_')) {
    name = name.substring(5);
  } else if (name.startsWith('pet_')) {
    name = name.substring(4);
  } else if (name.startsWith('cosmetic_')) {
    name = name.substring(9);
  } else if (name.startsWith('mount_')) {
    name = name.substring(6);
  }
  
  // Match level/tier suffixes like _l2 or _12
  name = name.replace(/_l(\d+)$/i, ' Lv.$1');
  name = name.replace(/_(\d+)$/, ' Lv.$1');
  
  // Replace underscores
  name = name.replace(/_/g, ' ');
  
  // Title Case
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();
}

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

export async function fetchMarketplaceListings(limit = 60, offset = 0): Promise<{ listings: MarketplaceListing[], total: number }> {
  try {
    const url = `https://fanout.kintara.gg/api/marketplace/listings?sort=latest&currency=all&category=all&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 15 } // Cache for 15s
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch marketplace listings: status ${res.status}`);
    }
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.listings)) {
      return { listings: [], total: 0 };
    }

    const now = Date.now();
    const mappedListings = data.listings.map((item: any) => {
      const normalized = normalizeItemType(item.itemType || '');
      const gameItem = getItem(normalized);
      const quantity = Number(item.quantity) || 1;
      const priceGold = Number(item.priceGold) || 0;
      const priceUsd = item.priceUsd ? Number(item.priceUsd) : undefined;
      
      const reservedUntilMsVal = item.reservedUntilMs ? Number(item.reservedUntilMs) : null;
      const reservedByVal = item.reservedBy || null;
      
      let status: "available" | "locked" | "available_expired_lock" = "available";
      let isReserved = false;
      let unlocksInMs = 0;
      let unlocksAt = "";

      if (reservedByVal) {
        if (reservedUntilMsVal && reservedUntilMsVal > now) {
          status = "locked";
          isReserved = true;
          unlocksInMs = reservedUntilMsVal - now;
          unlocksAt = new Date(reservedUntilMsVal).toISOString();
        } else {
          status = "available_expired_lock";
          isReserved = false;
          unlocksInMs = 0;
          unlocksAt = "";
        }
      }

      const isToken = item.currency === 'token';
      const isGold = item.currency === 'gold';
      const pricePerItemGold = isGold ? (priceGold / quantity) : undefined;
      const pricePerItemUsd = priceUsd ? (priceUsd / quantity) : undefined;

      return {
        id: String(item.id),
        sellerId: item.sellerId ? String(item.sellerId) : undefined,
        sellerName: item.sellerName || 'Unknown',
        itemType: item.itemType || 'unknown',
        itemName: formatItemType(item.itemType || ''),
        quantity,
        priceGold,
        priceUsd,
        currency: item.currency || 'token',
        createdAt: item.createdAt || new Date().toISOString(),
        reservedBy: reservedByVal,
        reservedUntilMs: reservedUntilMsVal,
        itemDurability: item.itemDurability ? Number(item.itemDurability) : null,
        status,
        isReserved,
        unlocksInMs,
        unlocksAt,
        pricePerItemUsd,
        pricePerItemGold,
        source: 'kintara',
        verified: true,
        itemCategory: gameItem.category !== 'Unknown' ? gameItem.category : 'Unknown',
        rarity: gameItem.rarity || 'Common',
        iconUrl: gameItem.emoji || '📦',
        sellerWallet: item.sellerId ? String(item.sellerId) : undefined,
      };
    });

    return { listings: mappedListings, total: data.total || mappedListings.length };
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return { listings: [], total: 0 };
  }
}

export async function fetchActiveOrders(wallet: string, sellerName?: string): Promise<MarketplaceListing[]> {
  try {
    const { listings } = await fetchMarketplaceListings(1000, 0);
    if (!sellerName) return [];
    return listings.filter(l => l.sellerName?.toLowerCase() === sellerName.toLowerCase());
  } catch {
    return [];
  }
}

