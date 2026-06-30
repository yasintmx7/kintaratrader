// ─── Kintara Item/Resource Registry ───────────────────────────────────────────
// Extended with marketplace items (Tools, Weapons, Consumables)

export type Item = {
  id: string;
  name: string;
  category: 'Materials' | 'Food' | 'Potions' | 'Tools' | 'Weapons' | 'Mounts' | 'Pets' | 'Cosmetics' | 'Currency' | 'Unknown';
  emoji: string;
  color: string;    // text/accent color
  bgColor: string;  // icon background
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
  iconPath: string; // public/items/*.svg
};

export const ITEMS: Record<string, Item> = {
  kins: {
    id: 'kins', name: 'KINS', category: 'Currency',
    emoji: '◈', color: '#58a6ff', bgColor: 'rgba(88, 166, 255, 0.1)',
    rarity: 'Legendary', iconPath: '/items/kins.svg',
  },
  gold: {
    id: 'gold', name: 'Gold', category: 'Currency',
    emoji: '🪙', color: '#e3b341', bgColor: 'rgba(227, 179, 65, 0.1)',
    rarity: 'Rare', iconPath: '/items/gold.svg',
  },
  coal: {
    id: 'coal', name: 'Coal', category: 'Materials',
    emoji: '⬛', color: '#8b949e', bgColor: 'rgba(139, 148, 158, 0.1)',
    rarity: 'Common', iconPath: '/items/coal.svg',
  },
  wood: {
    id: 'wood', name: 'Wood', category: 'Materials',
    emoji: '🪵', color: '#d29922', bgColor: 'rgba(210, 153, 34, 0.1)',
    rarity: 'Common', iconPath: '/items/wood.svg',
  },
  stone: {
    id: 'stone', name: 'Stone', category: 'Materials',
    emoji: '🪨', color: '#8b949e', bgColor: 'rgba(139, 148, 158, 0.1)',
    rarity: 'Common', iconPath: '/items/stone.svg',
  },
  metal: {
    id: 'metal', name: 'Metal', category: 'Materials',
    emoji: '⚙️', color: '#c9d1d9', bgColor: 'rgba(201, 209, 217, 0.1)',
    rarity: 'Uncommon', iconPath: '/items/metal.svg',
  },
  fish: {
    id: 'fish', name: 'Raw Fish', category: 'Food',
    emoji: '🐟', color: '#58a6ff', bgColor: 'rgba(88, 166, 255, 0.1)',
    rarity: 'Common', iconPath: '/items/fish.svg',
  },
  'cooked fish': {
    id: 'cooked fish', name: 'Cooked Fish', category: 'Food',
    emoji: '🍣', color: '#e3b341', bgColor: 'rgba(227, 179, 65, 0.1)',
    rarity: 'Uncommon', iconPath: '/items/cooked_fish.svg',
  },
  axe: {
    id: 'axe', name: 'Axe', category: 'Tools',
    emoji: '🪓', color: '#d29922', bgColor: 'rgba(210, 153, 34, 0.1)',
    rarity: 'Common', iconPath: '/items/axe.svg',
  },
  'axe lv.2': {
    id: 'axe lv.2', name: 'Axe Lv.2', category: 'Tools',
    emoji: '🪓', color: '#c9d1d9', bgColor: 'rgba(201, 209, 217, 0.1)',
    rarity: 'Uncommon', iconPath: '/items/axe_2.svg',
  },
  pickaxe: {
    id: 'pickaxe', name: 'Pickaxe', category: 'Tools',
    emoji: '⛏️', color: '#8b949e', bgColor: 'rgba(139, 148, 158, 0.1)',
    rarity: 'Common', iconPath: '/items/pickaxe.svg',
  },
  'pickaxe lv.2': {
    id: 'pickaxe lv.2', name: 'Pickaxe Lv.2', category: 'Tools',
    emoji: '⛏️', color: '#c9d1d9', bgColor: 'rgba(201, 209, 217, 0.1)',
    rarity: 'Uncommon', iconPath: '/items/pickaxe_2.svg',
  },
  'training sword': {
    id: 'training sword', name: 'Training Sword', category: 'Weapons',
    emoji: '🗡️', color: '#d29922', bgColor: 'rgba(210, 153, 34, 0.1)',
    rarity: 'Common', iconPath: '/items/sword.svg',
  },
  'wild sword': {
    id: 'wild sword', name: 'Wild Sword', category: 'Weapons',
    emoji: '⚔️', color: '#3fb950', bgColor: 'rgba(63, 185, 80, 0.1)',
    rarity: 'Uncommon', iconPath: '/items/sword_2.svg',
  },
};

export const UNKNOWN_ITEM: Item = {
  id: 'unknown', name: 'Unknown Item', category: 'Unknown',
  emoji: '📦', color: '#8b949e', bgColor: 'rgba(139, 148, 158, 0.1)',
  rarity: 'Common', iconPath: '/items/unknown.svg',
};

export function getItem(id: string): Item {
  return ITEMS[id.toLowerCase()] ?? UNKNOWN_ITEM;
}

export const ALL_ITEMS = Object.values(ITEMS);
