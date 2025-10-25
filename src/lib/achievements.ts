export type AchievementReward = {
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
        reward: { goldLingots: 10, casinoChips: 5 }
    },
    { 
        id: 2,
        name: "Estudiante Comprometido", 
        description: "Estudia por 30 horas", 
        hours: 30,
        reward: { goldLingots: 25, casinoChips: 10, gems: 1 }
    },
    { 
        id: 3,
        name: "Estudiante Veterano", 
        description: "Estudia por 50 horas", 
        hours: 50,
        reward: { goldLingots: 50, casinoChips: 20, gems: 3 }
    },
    { 
        id: 4,
        name: "Devorador de Libros", 
        description: "Estudia por 100 horas", 
        hours: 100,
        reward: { goldLingots: 100, gems: 10, chest: 'epic' }
    },
    { 
        id: 5,
        name: "Máquina de Estudio", 
        description: "Estudia por 250 horas", 
        hours: 250,
        reward: { goldLingots: 250, gems: 25, chest: 'epic' }
    },
    { 
        id: 6,
        name: "Cerebrito", 
        description: "Estudia por 500 horas", 
        hours: 500,
        reward: { goldLingots: 500, gems: 50, chest: 'legendary' }
    },
    { 
        id: 7,
        name: "Eminencia", 
        description: "Estudia por 1000 horas", 
        hours: 1000,
        reward: { goldLingots: 1000, gems: 100, chest: 'legendary' }
    },
];
