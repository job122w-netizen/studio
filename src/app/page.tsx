'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Square } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, increment } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateUserStreak } from "@/lib/streaks";
import { updateCasinoChips } from "@/lib/transactions";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const studySessionsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/studySessions`);
  }, [firestore, user]);

  const [isStudying, setIsStudying] = useState(false);
  const [studyDurationMinutes, setStudyDurationMinutes] = useState(25);
  const [remainingTime, setRemainingTime] = useState(25 * 60);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalSessionDuration, setTotalSessionDuration] = useState(25 * 60);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (isStudying && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (remainingTime <= 0 && isStudying) {
      handleStopStudy(true);
      
      const xpReward = Math.floor(totalSessionDuration / 60) * 50;
      toast({
        title: "¡Sesión de estudio completada!",
        description: `¡Has ganado ${xpReward} Puntos, 1 Lingote y 1 Ficha!`,
      });
      if (userProfileRef) {
          updateDocumentNonBlocking(userProfileRef, {
            experiencePoints: increment(xpReward),
            goldLingots: increment(1),
          });
          updateCasinoChips(userProfileRef, 1);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStudying, remainingTime, userProfileRef, toast, totalSessionDuration]);

  const handleStartStudy = () => {
    if (studyDurationMinutes <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La duración debe ser mayor a 0 minutos.",
      });
      return;
    }
    const durationInSeconds = studyDurationMinutes * 60;
    setTotalSessionDuration(durationInSeconds);
    setRemainingTime(durationInSeconds);
    setIsStudying(true);
    setSessionStartTime(new Date());
  };
  
  const handleStopStudy = (isCompleted = false) => {
    setIsStudying(false);
    
    const elapsedTime = totalSessionDuration - remainingTime;
    
    if (user && studySessionsRef && sessionStartTime && (elapsedTime > 10 || isCompleted)) {
      const endTime = new Date();
      const durationMinutes = Math.floor(elapsedTime / 60);

      addDocumentNonBlocking(studySessionsRef, {
          userId: user.uid,
          subject: 'Estudio General',
          startTime: sessionStartTime,
          endTime: endTime,
          durationMinutes: durationMinutes
      }).then(() => {
          if (!isCompleted) { 
            if (durationMinutes > 0) {
                toast({
                   title: "Sesión guardada",
                   description: `Has estudiado por ${durationMinutes} minutos.`,
               });
           } else {
                toast({
                   title: "Sesión guardada",
                   description: `Has estudiado por menos de un minuto.`,
               });
           }
          }
          if(userProfileRef) updateUserStreak(userProfileRef);
      });
       
    } else if (elapsedTime > 0 && elapsedTime <= 10 && !isCompleted) {
        toast({
            variant: "destructive",
            title: "Sesión no guardada",
            description: "La sesión de estudio debe durar más de 10 segundos.",
        });
    }
    
    setRemainingTime(studyDurationMinutes * 60);
    setSessionStartTime(null);
    if(timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isLoading = isUserLoading || isProfileLoading;
  
  const progress = totalSessionDuration > 0 ? (totalSessionDuration - remainingTime) / totalSessionDuration : 0;
  const minSize = 64; // 4rem
  const maxSize = 192; // 12rem
  const sphereSize = isStudying ? minSize + (maxSize - minSize) * progress : maxSize;


  if (isLoading && !userProfile) {
    return (
        <div className="flex justify-center items-center h-full">
            <div className="text-center">
                <p>Cargando tu espacio...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">Tu Espacio de Crecimiento</h1>
        <p className="text-muted-foreground mt-2">"La disciplina es el puente entre las metas y los logros."</p>
      </section>
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden bg-card/50">
        <CardContent className="p-8 flex flex-col items-center justify-center gap-8 min-h-[400px] bg-background/40">
            
            <div 
              className={cn(
                  "relative flex items-center justify-center rounded-full bg-primary/80 transition-all duration-1000 ease-linear",
                  isStudying ? "animate-pulse-glow shadow-glow" : "shadow-lg"
              )}
              style={{
                height: `${sphereSize}px`,
                width: `${sphereSize}px`,
              }}
            >
              {isStudying ? (
                <p className="text-5xl sm:text-6xl font-bold font-mono text-foreground drop-shadow-lg z-10">{formatTime(remainingTime)}</p>
              ) : (
                <div className="w-full max-w-sm flex flex-col items-center justify-center gap-4 text-center text-foreground">
                    <div className="flex flex-col items-center gap-2">
                        <label htmlFor="duration-input" className="font-semibold">Minutos de Estudio</label>
                        <Input
                          id="duration-input"
                          type="number"
                          placeholder="25"
                          value={studyDurationMinutes}
                          onChange={(e) => setStudyDurationMinutes(parseInt(e.target.value, 10))}
                          disabled={isLoading}
                          className="w-24 text-center text-xl font-bold"
                        />
                    </div>
                    <Button size="lg" className="w-3/4" onClick={handleStartStudy} disabled={isLoading || studyDurationMinutes <= 0}>
                        <Play className="mr-2 h-5 w-5"/>
                        Iniciar Sesión
                    </Button>
                </div>
              )}
            </div>
            
            {isStudying && (
                <Button size="lg" variant="ghost" className="w-3/4" onClick={() => handleStopStudy(false)} disabled={isLoading}>
                    <Square className="mr-2 h-5 w-5"/>
                    Detener
                </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
