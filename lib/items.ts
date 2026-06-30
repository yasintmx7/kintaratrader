// ─── Kintara Item/Resource Registry ───────────────────────────────────────────
// Note: Item names in KINS transfers cannot be determined from wallet data alone.
// These are placeholders for when marketplace metadata is available.

export type Item = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  color: string;    // text/accent color
  bgColor: string;  // icon background
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  iconPath: string; // public/items/*.svg
};

export const ITEMS: Record<string, Item> = {
  coal: {
    id: 'coal', name: 'Coal', category: 'Mining',
    emoji: '⬛', color: '#9ca3af', bgColor: '#111827',
    rarity: 'common', iconPath: '/items/coal.svg',
  },
  wood: {
    id: 'wood', name: 'Wood', category: 'Forestry',
    emoji: '🪵', color: '#b45309', bgColor: '#1c1005',
    rarity: 'common', iconPath: '/items/wood.svg',
  },
  gold: {
    id: 'gold', name: 'Gold', category: 'Mining',
    emoji: '🪙', color: '#f59e0b', bgColor: '#1c1500',
    rarity: 'rare', iconPath: '/items/gold.svg',
  },
  stone: {
    id: 'stone', name: 'Stone', category: 'Mining',
    emoji: '🪨', color: '#6b7280', bgColor: '#111827',
    rarity: 'common', iconPath: '/items/stone.svg',
  },
  food: {
    id: 'food', name: 'Food', category: 'Farming',
    emoji: '🌾', color: '#22c55e', bgColor: '#001a08',
    rarity: 'common', iconPath: '/items/food.svg',
  },
  fish: {
    id: 'fish', name: 'Fish', category: 'Fishing',
    emoji: '🐟', color: '#3b82f6', bgColor: '#00081a',
    rarity: 'common', iconPath: '/items/fish.svg',
  },
  iron: {
    id: 'iron', name: 'Iron', category: 'Mining',
    emoji: '⚙️', color: '#94a3b8', bgColor: '#0c0e12',
    rarity: 'uncommon', iconPath: '/items/iron.svg',
  },
  copper: {
    id: 'copper', name: 'Copper', category: 'Mining',
    emoji: '🔶', color: '#f97316', bgColor: '#1a0a00',
    rarity: 'uncommon', iconPath: '/items/copper.svg',
  },
};

export const UNKNOWN_ITEM: Item = {
  id: 'unknown', name: 'Unknown Item', category: 'Unknown',
  emoji: '📦', color: '#475569', bgColor: '#0f172a',
  rarity: 'common', iconPath: '/items/unknown.svg',
};

export function getItem(id: string): Item {
  return ITEMS[id.toLowerCase()] ?? UNKNOWN_ITEM;
}

export const ALL_ITEMS = Object.values(ITEMS);
