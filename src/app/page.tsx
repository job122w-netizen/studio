'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, Square } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, serverTimestamp, increment } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateUserStreak } from "@/lib/streaks";
import { updateCasinoChips } from "@/lib/transactions";

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
      handleStopStudy(true); // Automatically stop and save when timer finishes
      
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

  if (isLoading && !userProfile) { // Show loading only on initial load
    return (
        <div className="flex justify-center items-center h-full">
            <div className="text-center">
                <p>Cargando tu espacio...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <section className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">Tu Espacio de Crecimiento</h1>
        <p className="text-muted-foreground mt-2">"La disciplina es el puente entre las metas y los logros."</p>
      </section>
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Registrar Estudio</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col items-center justify-center gap-4 min-h-[350px] relative bg-muted/20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full shadow-glow blur-2xl"></div>

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center gap-6 text-center p-4">
                {isStudying ? (
                    <>
                        <p className="text-7xl font-bold font-mono text-foreground drop-shadow-lg">{formatTime(remainingTime)}</p>
                        <Button size="lg" className="w-3/4" onClick={() => handleStopStudy(false)} disabled={isLoading}>
                            <Square className="mr-2 h-5 w-5"/>
                            Detener y Guardar
                        </Button>
                    </>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="flex flex-col items-center gap-2">
                            <label htmlFor="duration-input" className="text-foreground font-semibold">Minutos de Estudio</label>
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
                        <Button size="lg" className="w-full" onClick={handleStartStudy} disabled={isLoading || studyDurationMinutes <= 0}>
                            <Play className="mr-2 h-5 w-5"/>
                            Iniciar Sesión
                        </Button>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
