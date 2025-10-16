
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
    type: 'goldLingots' | 'casinoChips' | 'chest' | 'profileBackground';
    quantity?: number;
    itemId?: string; // For backgrounds
};

export type HvPassLevel = {
    level: number;
    freeReward: HvPassReward;
    premiumReward?: HvPassReward;
};

// Generate 100 levels for the pass
export const hvPassLevels: HvPassLevel[] = Array.from({ length: 100 }, (_, i) => {
    const level = i + 1;
    let freeReward: HvPassReward;

    // Logic for more varied free rewards
    if (level % 10 === 0) {
        freeReward = { type: 'chest', quantity: 1 }; // Chest every 10 levels
    } else if (level % 5 === 0) {
        freeReward = { type: 'casinoChips', quantity: 5 }; // Casino chips every 5 levels (but not 10)
    } else {
        freeReward = { type: 'goldLingots', quantity: 10 }; // Gold lingots for other levels
    }
    
    let premiumReward: HvPassReward | undefined;

    // Premium rewards logic (remains more exclusive)
    if (level % 10 === 0 && level !== 100) {
        premiumReward = { type: 'chest', quantity: 1 };
    } else if (level % 5 === 0) {
        premiumReward = { type: 'casinoChips', quantity: 10 };
    } else if (level % 3 === 0) {
        premiumReward = { type: 'goldLingots', quantity: 50 };
    }
    
    // Specific premium rewards for profile backgrounds, overriding previous logic
    const backgroundLevels: { [key: number]: string } = {
        20: 'pixel-art-1', 30: 'pixel-art-2', 40: 'pixel-art-3',
        50: 'pixel-art-4', 60: 'pixel-art-5', 70: 'pixel-art-6',
        80: 'pixel-art-7', 90: 'pixel-art-8', 95: 'pixel-art-9',
        100: 'pixel-art-10'
    };

    if (backgroundLevels[level]) {
        premiumReward = { type: 'profileBackground', itemId: backgroundLevels[level] };
    }

    return {
        level,
        freeReward,
        premiumReward,
    };
});
