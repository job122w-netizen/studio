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
        reward: { xp: 2500, goldLingots: 25, casinoChips: 10 }
    },
    { 
        id: 2,
        name: "Disciplina de Hierro", 
        description: "Alcanza una racha de 30 días", 
        days: 30,
        reward: { xp: 10000, goldLingots: 100, casinoChips: 50, gems: 5, chest: 'epic' }
    },
    { 
        id: 3,
        name: "Leyenda Viviente", 
        description: "Alcanza una racha de 365 días", 
        days: 365,
        reward: { xp: 150000, goldLingots: 1500, gems: 100, chest: 'legendary' }
    },
];
