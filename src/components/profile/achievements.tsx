'use client';

import { Trophy, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { studyAchievements, type StudyAchievement } from "@/lib/achievements";
import { Badge } from "../ui/badge";

type AchievementsListProps = {
    totalStudyHours: number;
    claimedAchievements: number[];
    onClaim: (achievement: StudyAchievement) => void;
};

export function AchievementsList({ totalStudyHours, claimedAchievements, onClaim }: AchievementsListProps) {
    return (
        <ul className="space-y-4">
            {studyAchievements.map((ach) => {
                const isCompleted = totalStudyHours >= ach.hours;
                const isClaimed = claimedAchievements.includes(ach.id);
                const progress = isCompleted ? 100 : (totalStudyHours / ach.hours) * 100;
                
                let rewardText = [];
                if (ach.reward.xp) rewardText.push(`${ach.reward.xp.toLocaleString()} XP`);
                if (ach.reward.goldLingots) rewardText.push(`${ach.reward.goldLingots} Lingotes`);
                if (ach.reward.casinoChips) rewardText.push(`${ach.reward.casinoChips} Fichas`);
                if (ach.reward.gems) rewardText.push(`${ach.reward.gems} Gemas`);
                if (ach.reward.chest) rewardText.push(`1 Cofre ${ach.reward.chest === 'epic' ? 'Épico' : 'Legendario'}`);


                return (
                    <li key={ach.id} className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Trophy className={`h-8 w-8 transition-colors ${isCompleted ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                                <div>
                                    <p className={`font-semibold transition-colors ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.name}</p>
                                    <p className="text-sm text-muted-foreground">{ach.description}</p>
                                </div>
                            </div>
                            {isCompleted && !isClaimed && (
                                <Button size="sm" onClick={() => onClaim(ach)}>Reclamar</Button>
                            )}
                            {isCompleted && isClaimed && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold text-sm">Reclamado</span>
                                </div>
                            )}
                        </div>

                        {!isCompleted && (
                            <div className="space-y-1">
                                <Progress value={progress} className="h-2" />
                                <p className="text-xs text-muted-foreground text-right">{totalStudyHours.toLocaleString()} / {ach.hours.toLocaleString()} horas</p>
                            </div>
                        )}
                        
                        {isCompleted && (
                            <div className="border-t pt-2">
                                <p className="text-xs font-semibold text-primary">Recompensa:</p>
                                <p className="text-xs text-muted-foreground">{rewardText.join(', ')}</p>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
