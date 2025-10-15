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

export const ejerciciosData = [
  {
    id: 1,
    title: 'Flexiones (3 series)',
    category: 'Fuerza',
    description: 'Realiza 3 series del máximo de flexiones que puedas.',
    image: getImage('exercise-pushups'),
    xpReward: 50,
  },
  {
    id: 2,
    title: 'Cardio 20 Minutos',
    category: 'Cardio',
    description: 'Corre, salta la cuerda o usa una elíptica por 20 minutos.',
    image: getImage('exercise-cardio'),
    xpReward: 75,
  },
  {
    id: 3,
    title: 'Estiramiento Completo',
    category: 'Flexibilidad',
    description: 'Dedica 15 minutos a estirar todos tus grupos musculares.',
    image: getImage('exercise-stretching'),
    xpReward: 40,
  },
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
