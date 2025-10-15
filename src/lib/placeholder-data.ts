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
    title: 'Meditación de 10 Minutos',
    category: 'Mindfulness',
    description: 'Encuentra un lugar tranquilo y concéntrate en tu respiración.',
    image: getImage('exercise-mindfulness'),
  },
  {
    id: 2,
    title: 'Técnica Pomodoro',
    category: 'Productividad',
    description: 'Trabaja en bloques de 25 minutos con descansos de 5 minutos.',
    image: getImage('exercise-productivity'),
  },
  {
    id: 3,
    title: 'Escritura de Gratitud',
    category: 'Bienestar Emocional',
    description: 'Escribe tres cosas por las que estás agradecido hoy.',
    image: getImage('exercise-journal'),
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
