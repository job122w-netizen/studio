
import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string): ImagePlaceholder | undefined => PlaceHolderImages.find(img => img.id === id);

export const rankingData = [
  { rank: 1, user: 'Valeria G.', points: 12500, avatar: 'https://i.pravatar.cc/40?img=1' },
  { rank: 2, user: 'Carlos P.', points: 11800, avatar: 'https://i.pravatar.cc/40?img=2' },
  { rank: 3, user: 'Ana R.', points: 11500, avatar: 'https://i.pravatar.cc/40?img=3' },
  { rank: 4, user: 'Tú', points: 10900, avatar: getImage('user-avatar')?.imageUrl || 'https://i.pravatar.cc/40?img=4' },
  { rank: 5, user: 'Luis F.', points: 10200, avatar: 'https://i.pravatar.cc/40?img=5' },
  { rank: 6, user: 'Sofia M.', points: 9800, avatar: 'https://i.pravatar.cc/40?img=6' },
];

export const tiendaItems = [
  {
    id: 1,
    name: 'Gema de Enfoque',
    price: 500,
    description: 'Aumenta los puntos de estudio en un 10% por 1 hora.',
    image: getImage('store-item-1'),
  },
  {
    id: 2,
    name: 'Poción de Energía',
    price: 300,
    description: 'Permite completar un ejercicio extra al día.',
    image: getImage('store-item-2'),
  },
  {
    id: 3,
    name: 'Llave de Logro',
    price: 1000,
    description: 'Desbloquea un logro exclusivo.',
    image: getImage('store-item-3'),
  },
  {
    id: 4,
    name: 'Escudo Protector',
    price: 750,
    description: 'Protege tu racha de un día de inactividad.',
    image: getImage('store-item-4'),
  },
];

export type HvPassReward = {
    type: 'goldLingots' | 'casinoChips' | 'chest' | 'profileBackground' | 'gem';
    quantity?: number;
    itemId?: string; // For backgrounds
};

export type HvPassLevel = {
    level: number;
    freeReward: HvPassReward;
    premiumReward: HvPassReward;
};

// --- New Reward Generation Logic ---

const generateRandomGemLevels = (): Set<number> => {
    const gemLevels = new Set<number>();
    while (gemLevels.size < 20) {
        const randomLevel = Math.floor(Math.random() * 100) + 1;
        gemLevels.add(randomLevel);
    }
    return gemLevels;
};

const gemLevels = generateRandomGemLevels();

export const hvPassLevels: HvPassLevel[] = Array.from({ length: 100 }, (_, i) => {
    const level = i + 1;

    // --- Free Rewards ---
    let freeReward: HvPassReward;
    if (gemLevels.has(level)) {
        freeReward = { type: 'gem', quantity: 1 };
    } else if (level % 10 === 0) {
        freeReward = { type: 'chest', quantity: 1 };
    } else if (level % 5 === 0) {
        freeReward = { type: 'casinoChips', quantity: 5 };
    } else {
        freeReward = { type: 'goldLingots', quantity: 10 };
    }
    
    // --- Premium Rewards (now on every level) ---
    let premiumReward: HvPassReward;
    const backgroundLevels: { [key: number]: string } = {
        20: 'pixel-art-1', 30: 'pixel-art-2', 40: 'pixel-art-3',
        50: 'pixel-art-4', 60: 'pixel-art-5', 70: 'pixel-art-6',
        80: 'pixel-art-7', 90: 'pixel-art-8', 95: 'pixel-art-9',
        100: 'pixel-art-10'
    };

    if (backgroundLevels[level]) {
        premiumReward = { type: 'profileBackground', itemId: backgroundLevels[level] };
    } else if (level % 10 === 0) {
        // Special chest every 10 levels
        premiumReward = { type: 'chest', quantity: 1 };
    } else if (level % 5 === 0) {
        // More casino chips every 5 levels
        premiumReward = { type: 'casinoChips', quantity: 15 };
    } else if (level % 2 === 0) {
        // Generous gold lingots on even levels
        premiumReward = { type: 'goldLingots', quantity: 50 };
    } else {
        // Casino chips on odd levels
        premiumReward = { type: 'casinoChips', quantity: 5 };
    }

    return {
        level,
        freeReward,
        premiumReward,
    };
});
