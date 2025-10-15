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
    const freeReward: HvPassReward = { type: 'goldLingots', quantity: (level % 5 === 0) ? 25 : 10 };
    
    let premiumReward: HvPassReward | undefined;

    if (level % 10 === 0) {
        premiumReward = { type: 'chest', quantity: 1 };
    } else if (level % 5 === 0) {
        premiumReward = { type: 'casinoChips', quantity: 10 };
    } else if (level % 3 === 0) {
        premiumReward = { type: 'goldLingots', quantity: 50 };
    }
    
    // Assign one of the 10 profile backgrounds at specific premium levels
    if (level === 20) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-1' };
    if (level === 30) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-2' };
    if (level === 40) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-3' };
    if (level === 50) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-4' };
    if (level === 60) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-5' };
    if (level === 70) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-6' };
    if (level === 80) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-7' };
    if (level === 90) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-8' };
    if (level === 95) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-9' };
    if (level === 100) premiumReward = { type: 'profileBackground', itemId: 'pixel-art-10' };


    return {
        level,
        freeReward,
        premiumReward,
    };
});
