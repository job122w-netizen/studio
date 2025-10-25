'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle, Coins, Lock, Star, Ticket, Zap, Box, Gem, Palette } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { hvPassLevels, type HvPassReward } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

const XP_PER_LEVEL = 2000;

const RewardIcon = ({ reward }: { reward: HvPassReward }) => {
    switch (reward.type) {
        case 'goldLingots':
            return <Coins className="h-6 w-6 text-yellow-500" />;
        case 'casinoChips':
            return <Ticket className="h-6 w-6 text-red-400" />;
        case 'chest':
            return <Box className="h-6 w-6 text-orange-400" />;
        case 'profileBackground':
            return <div className="h-6 w-6 rounded-sm border-2 border-purple-400 bg-gray-600" />;
        case 'colorTheme':
            return <Palette className="h-6 w-6 text-blue-400" />;
        case 'gem':
            return <Gem className="h-6 w-6 text-purple-400" />;
        default:
            return <Star className="h-6 w-6 text-gray-400" />;
    }
}

export default function PaseHVPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const hasPremiumPass = userProfile?.hasPremiumPass ?? false;

  const handlePurchasePass = async () => {
    if (!userProfileRef) return;
    try {
        await updateDoc(userProfileRef, { hasPremiumPass: true });
        toast({
            title: "¡Pase Premium Activado!",
            description: "¡Ahora tienes acceso a todas las recompensas exclusivas!",
        });
    } catch (error) {
        console.error("Error purchasing pass: ", error);
        toast({
            title: "Error",
            description: "No se pudo activar el pase premium. Intenta de nuevo.",
            variant: "destructive"
        });
    }
  }

  const currentLevel = userProfile?.hvPassLevel ?? 1;
  const currentXP = userProfile?.hvPassXp ?? 0;
  const progressToNextLevel = (currentXP / XP_PER_LEVEL) * 100;
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
        <div className="space-y-8 animate-fade-in">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
            </Card>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {Array.from({length: 20}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <section className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500" />
        <h1 className="text-3xl font-bold font-headline text-foreground mt-2">Pase de Batalla HV</h1>
        <p className="text-muted-foreground mt-2">Sube de nivel y desbloquea recompensas exclusivas.</p>
      </section>

      <Card>
          <CardHeader>
              <CardTitle>Nivel {currentLevel}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentXP.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} Puntos para el siguiente nivel</p>
          </CardHeader>
          <CardContent>
              <Progress value={progressToNextLevel} />
          </CardContent>
      </Card>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {hvPassLevels.map(level => (
            <div key={level.level} className={cn(
                "relative rounded-lg border p-2 flex flex-col items-center justify-between aspect-square",
                currentLevel >= level.level ? "bg-accent/50 border-primary/50" : "bg-card"
            )}>
                <span className={cn(
                    "absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold",
                    currentLevel >= level.level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                    {level.level}
                </span>

                {/* Free Reward */}
                <div className="flex flex-col items-center gap-1 opacity-70">
                    <RewardIcon reward={level.freeReward} />
                    <span className="text-xs text-center">{level.freeReward.quantity}</span>
                </div>

                {/* Premium Reward */}
                <div className="relative w-full border-t border-dashed my-2">
                    <Star className="absolute left-1/2 -translate-x-1/2 -top-2.5 h-4 w-4 text-yellow-400 bg-background px-0.5"/>
                </div>

                 <div className="flex flex-col items-center gap-1">
                    {!hasPremiumPass && level.premiumReward && <Lock className="absolute h-6 w-6 text-white/20 z-10"/>}
                    {level.premiumReward ? (
                        <>
                        <RewardIcon reward={level.premiumReward} />
                        <span className={cn(
                            "text-xs text-center font-bold",
                            hasPremiumPass ? "text-yellow-400" : "text-muted-foreground"
                        )}>{level.premiumReward.quantity || ''}</span>
                        </>
                    ) : (
                        <div className="h-9"></div>
                    )}
                </div>

                {currentLevel >= level.level && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        <CheckCircle className="h-8 w-8 text-white/80"/>
                    </div>
                )}
            </div>
        ))}
      </div>

       {!hasPremiumPass && (
         <Card className="shadow-lg bg-gradient-to-br from-primary via-purple-600 to-indigo-700 text-primary-foreground mt-8">
            <CardHeader>
                <CardTitle className="text-2xl">¡Consigue el Pase Premium!</CardTitle>
                <CardDescription className="text-purple-200">Abre cofres en la tienda para tener la oportunidad de ganar acceso a todas las recompensas exclusivas del pase.</CardDescription>
            </CardHeader>
        </Card>
       )}
    </div>
  );
}
