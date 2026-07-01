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
  'molten rock': {
    id: 'molten rock', name: 'Molten Rock', category: 'Materials',
    emoji: '🌋', color: '#ff5f40', bgColor: 'rgba(255, 95, 64, 0.1)',
    rarity: 'Rare', iconPath: '/items/molten_rock.svg',
  },
  'strength potion': {
    id: 'strength potion', name: 'Strength Potion', category: 'Potions',
    emoji: '🧪', color: '#ff3b30', bgColor: 'rgba(255, 59, 48, 0.1)',
    rarity: 'Rare', iconPath: '/items/strength_potion.svg',
  },
  'shield potion': {
    id: 'shield potion', name: 'Shield Potion', category: 'Potions',
    emoji: '🧪', color: '#34c759', bgColor: 'rgba(52, 199, 89, 0.1)',
    rarity: 'Rare', iconPath: '/items/shield_potion.svg',
  },
  'wild sword lv.12': {
    id: 'wild sword lv.12', name: 'Wild Sword Lv.12', category: 'Weapons',
    emoji: '⚔️', color: '#a371f7', bgColor: 'rgba(163, 113, 247, 0.1)',
    rarity: 'Legendary', iconPath: '/items/sword_wild_12.svg',
  },
  'mounts': {
    id: 'mounts', name: 'Mounts', category: 'Mounts',
    emoji: '🐴', color: '#f2a900', bgColor: 'rgba(242, 169, 0, 0.1)',
    rarity: 'Rare', iconPath: '/items/mounts.svg',
  },
  'pets': {
    id: 'pets', name: 'Pets', category: 'Pets',
    emoji: '🐾', color: '#ff2d55', bgColor: 'rgba(255, 45, 85, 0.1)',
    rarity: 'Rare', iconPath: '/items/pets.svg',
  },
  'cosmetics': {
    id: 'cosmetics', name: 'Cosmetics', category: 'Cosmetics',
    emoji: '✨', color: '#007aff', bgColor: 'rgba(0, 122, 255, 0.1)',
    rarity: 'Rare', iconPath: '/items/cosmetics.svg',
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

export function getDefaultPrice(itemId: string): number {
  switch (itemId.toLowerCase()) {
    case 'coal': return 2;
    case 'fish': return 3;
    case 'stone': return 4;
    case 'wood': return 5;
    case 'cooked fish': return 8;
    case 'metal': return 12;
    case 'gold': return 50;
    case 'axe': return 80;
    case 'pickaxe': return 80;
    case 'training sword': return 100;
    case 'axe lv.2': return 250;
    case 'pickaxe lv.2': return 250;
    case 'wild sword': return 400;
    default: return 10;
  }
}

export function getItemForTransfer(amount: number, signature: string): { item: Item; quantity: number } {
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    hash = signature.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const candidates = Object.values(ITEMS).filter(item => item.id !== 'kins');
  const item = candidates[hash % candidates.length];

  let unitPrice = 10;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('kins_item_prices');
      if (stored) {
        const overrides = JSON.parse(stored);
        if (overrides[item.id] !== undefined && Number(overrides[item.id]) > 0) {
          unitPrice = Number(overrides[item.id]);
        } else {
          unitPrice = getDefaultPrice(item.id);
        }
      } else {
        unitPrice = getDefaultPrice(item.id);
      }
    } catch {
      unitPrice = getDefaultPrice(item.id);
    }
  } else {
    unitPrice = getDefaultPrice(item.id);
  }

  const quantity = Math.max(1, Math.round(amount / unitPrice));
  return { item, quantity };
}
