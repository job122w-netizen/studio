import type { AchievementReward } from './achievements';

export type StreakAchievement = {
    id: number;
    name: string;
    description: string;
    days: number;
    reward: AchievementReward;
};

export const streakAchievements: StreakAchievement[] = [
    { 
        id: 1,
        name: "Constancia", 
        description: "Alcanza una racha de 7 días", 
        days: 7,
        reward: { goldLingots: 25, casinoChips: 10 }
    },
    { 
        id: 2,
        name: "Disciplina de Hierro", 
        description: "Alcanza una racha de 30 días", 
        days: 30,
        reward: { goldLingots: 100, casinoChips: 50, gems: 10, chest: 'epic' }
    },
    { 
        id: 3,
        name: "Leyenda Viviente", 
        description: "Alcanza una racha de 365 días", 
        days: 365,
        reward: { goldLingots: 1500, gems: 150, chest: 'legendary' }
    },
];
