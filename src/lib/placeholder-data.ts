import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string): ImagePlaceholder | undefined => PlaceHolderImages.find(img => img.id === id);

export type TiendaItem = {
    id: number;
    name: string;
    price: number;
    description: string;
    currency: 'gems' | 'goldLingots';
    consumable: boolean;
};

export const rankingData = [
  { rank: 1, user: 'Valeria G.', points: 12500, avatar: 'https://i.pravatar.cc/40?img=1' },
  { rank: 2, user: 'Carlos P.', points: 11800, avatar: 'https://i.pravatar.cc/40?img=2' },
  { rank: 3, user: 'Ana R.', points: 11500, avatar: 'https://i.pravatar.cc/40?img=3' },
  { rank: 4, user: 'Tú', points: 10900, avatar: getImage('user-avatar')?.imageUrl || 'https://i.pravatar.cc/40?img=4' },
  { rank: 5, user: 'Luis F.', points: 10200, avatar: 'https://i.pravatar.cc/40?img=5' },
  { rank: 6, user: 'Sofia M.', points: 9800, avatar: 'https://i.pravatar.cc/40?img=6' },
];

export const tiendaItems: TiendaItem[] = [
  {
    id: 1,
    name: 'Gema de Enfoque',
    price: 3,
    description: 'Duplica las recompensas de estudio por 14 horas.',
    currency: 'gems',
    consumable: true,
  },
  {
    id: 2,
    name: 'Poción de Energía',
    price: 300,
    description: 'Permite completar un ejercicio extra al día.',
    currency: 'goldLingots',
    consumable: true,
  },
  {
    id: 3,
    name: 'Llave de Logro',
    price: 1000,
    description: 'Desbloquea un logro exclusivo.',
    currency: 'goldLingots',
    consumable: false,
  },
  {
    id: 4,
    name: 'Escudo Protector',
    price: 10,
    description: 'Protege tu racha de un día de inactividad.',
    currency: 'goldLingots',
    consumable: true,
  },
  {
    id: 5,
    name: '1 Gema',
    price: 10,
    description: 'La moneda premium para artículos exclusivos.',
    currency: 'goldLingots',
    consumable: true,
  },
  {
    id: 6,
    name: 'Pack de 10 Fichas',
    price: 15,
    description: 'Para probar tu suerte en el casino.',
    currency: 'goldLingots',
    consumable: true,
  },
  {
    id: 7,
    name: 'Cofre Épico',
    price: 5,
    description: 'Contiene lingotes, fichas, y la probabilidad de obtener cosméticos o el Pase Premium.',
    currency: 'gems',
    consumable: true,
  },
  {
    id: 8,
    name: 'Cofre Legendario',
    price: 7,
    description: 'Grandes recompensas y más probabilidad de obtener cosméticos o el Pase Premium.',
    currency: 'gems',
    consumable: true,
  },
];

export type HvPassReward = {
    type: 'goldLingots' | 'casinoChips' | 'chest' | 'profileBackground' | 'gem' | 'colorTheme';
    quantity?: number;
    itemId?: string; // For backgrounds or themes
};

export type HvPassLevel = {
    level: number;
    freeReward: HvPassReward;
    premiumReward?: HvPassReward;
};


// --- Pre-generated HV Pass Levels ---
// This array is now static to improve performance. It was previously generated on each page load.
export const hvPassLevels: HvPassLevel[] = [
  { level: 1, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 2, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 3, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 4, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 5, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 6, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 7, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 8, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 9, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 10, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'chest', quantity: 1 } },
  { level: 11, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 12, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 13, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 14, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 15, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 16, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 17, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 18, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 19, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 20, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'colorTheme', itemId: 'theme-blue' } },
  { level: 21, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 22, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 23, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 24, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 25, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 26, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 27, freeReward: { type: 'goldLingots', quantity: 2 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 28, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 29, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 30, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'colorTheme', itemId: 'theme-turquoise' } },
  { level: 31, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 32, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 33, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 34, freeReward: { type: 'goldLingots', quantity: 2 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 35, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 36, freeReward: { type: 'goldLingots', quantity: 2 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 37, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 38, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 39, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 40, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'colorTheme', itemId: 'theme-green' } },
  { level: 41, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 42, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 43, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 44, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 45, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 46, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 47, freeReward: { type: 'goldLingots', quantity: 2 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 48, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 49, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 50, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'colorTheme', itemId: 'theme-lightblue' } },
  { level: 51, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 52, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 53, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 54, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 55, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 56, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 57, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 58, freeReward: { type: 'goldLingots', quantity: 2 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 59, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 60, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'chest', quantity: 1 } },
  { level: 61, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 62, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 63, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 64, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 65, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 66, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 67, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 68, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 69, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 70, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'chest', quantity: 1 } },
  { level: 71, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 72, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 73, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 74, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 75, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 15 } },
  { level: 76, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 77, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 78, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 79, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 80, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'chest', quantity: 1 } },
  { level: 81, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 82, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 83, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 84, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 85, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'chest', quantity: 1 } },
  { level: 86, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 87, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 88, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 89, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 90, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'chest', quantity: 1 } },
  { level: 91, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 92, freeReward: { type: 'goldLingots', quantity: 3 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 93, freeReward: { type: 'gem', quantity: 1 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 94, freeReward: { type: 'goldLingots', quantity: 2 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 95, freeReward: { type: 'casinoChips', quantity: 5 }, premiumReward: { type: 'chest', quantity: 1 } },
  { level: 96, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 97, freeReward: { type: 'goldLingots', quantity: 5 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 98, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'goldLingots', quantity: 50 } },
  { level: 99, freeReward: { type: 'goldLingots', quantity: 4 }, premiumReward: { type: 'casinoChips', quantity: 5 } },
  { level: 100, freeReward: { type: 'chest', quantity: 1 }, premiumReward: { type: 'gem', quantity: 10 } }
];
