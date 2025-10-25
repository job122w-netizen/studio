export type AchievementReward = {
    xp?: number;
    goldLingots?: number;
    casinoChips?: number;
    gems?: number;
    chest?: 'epic' | 'legendary';
};

export type StudyAchievement = {
    id: number;
    name: string;
    description: string;
    hours: number;
    reward: AchievementReward;
};

export const studyAchievements: StudyAchievement[] = [
    { 
        id: 1,
        name: "Estudiante Dedicado", 
        description: "Estudia por 10 horas", 
        hours: 10,
        reward: { xp: 1000, goldLingots: 10, casinoChips: 5 }
    },
    { 
        id: 2,
        name: "Estudiante Comprometido", 
        description: "Estudia por 30 horas", 
        hours: 30,
        reward: { xp: 3000, goldLingots: 25, casinoChips: 10, gems: 1 }
    },
    { 
        id: 3,
        name: "Estudiante Veterano", 
        description: "Estudia por 50 horas", 
        hours: 50,
        reward: { xp: 5000, goldLingots: 50, casinoChips: 20, gems: 3 }
    },
    { 
        id: 4,
        name: "Devorador de Libros", 
        description: "Estudia por 100 horas", 
        hours: 100,
        reward: { xp: 10000, goldLingots: 100, gems: 5, chest: 'epic' }
    },
    { 
        id: 5,
        name: "Máquina de Estudio", 
        description: "Estudia por 250 horas", 
        hours: 250,
        reward: { xp: 25000, goldLingots: 250, gems: 10, chest: 'epic' }
    },
    { 
        id: 6,
        name: "Cerebrito", 
        description: "Estudia por 500 horas", 
        hours: 500,
        reward: { xp: 50000, goldLingots: 500, gems: 25, chest: 'legendary' }
    },
    { 
        id: 7,
        name: "Eminencia", 
        description: "Estudia por 1000 horas", 
        hours: 1000,
        reward: { xp: 100000, goldLingots: 1000, gems: 50, chest: 'legendary' }
    },
];
