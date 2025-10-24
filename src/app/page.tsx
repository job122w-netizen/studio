'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ListChecks, BookOpen, Play, Square } from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, addDoc, query, orderBy, limit, serverTimestamp, increment } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateUserStreak } from "@/lib/streaks";
import { updateCasinoChips } from "@/lib/transactions";
import { cn } from "@/lib/utils";

const STUDY_DURATION = 25 * 60; // 25 minutes

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

  const recentStudySessionsQuery = useMemoFirebase(() => {
    if (!studySessionsRef) return null;
    return query(studySessionsRef, orderBy("endTime", "desc"), limit(5));
  }, [studySessionsRef]);

  const { data: recentActivities } = useCollection(recentStudySessionsQuery);


  const [isStudying, setIsStudying] = useState(false);
  const [remainingTime, setRemainingTime] = useState(STUDY_DURATION);
  const [studySubject, setStudySubject] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

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
      toast({
        title: "¡Sesión de estudio completada!",
        description: `¡Has ganado 1250 Puntos, 1 Lingote y 1 Ficha por completar 25 minutos!`,
      });
      if (userProfileRef) {
          updateDocumentNonBlocking(userProfileRef, {
            experiencePoints: increment(1250),
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
  }, [isStudying, remainingTime, userProfileRef, toast]);

  const handleStartStudy = () => {
    if (!studySubject) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, introduce un tema de estudio.",
      });
      return;
    }
    setIsStudying(true);
    setSessionStartTime(new Date());
    setRemainingTime(STUDY_DURATION);
  };
  
  const handleStopStudy = (isCompleted = false) => {
    setIsStudying(false);
    
    const elapsedTime = STUDY_DURATION - remainingTime;
    
    if (user && studySessionsRef && sessionStartTime && (elapsedTime > 10 || isCompleted)) {
      const endTime = new Date();
      const durationMinutes = Math.floor(elapsedTime / 60);

      addDocumentNonBlocking(studySessionsRef, {
          userId: user.uid,
          subject: studySubject,
          startTime: sessionStartTime,
          endTime: endTime,
          durationMinutes: durationMinutes
      }).then(() => {
          if (!isCompleted) { // Avoid double toast
            if (durationMinutes > 0) {
                toast({
                   title: "Sesión guardada",
                   description: `Has estudiado "${studySubject}" por ${durationMinutes} minutos.`,
               });
           } else {
                toast({
                   title: "Sesión guardada",
                   description: `Has estudiado "${studySubject}" por menos de un minuto.`,
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
    
    setRemainingTime(STUDY_DURATION);
    setStudySubject("");
    setSessionStartTime(null);
    if(timerRef.current) clearInterval(timerRef.current);
  };


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return "Menos de 1 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  }
  
  const xpFromDuration = (minutes: number) => {
     // Simplified XP calculation, as the main reward is for 25 mins now.
    return Math.floor(minutes / 5) * 50;
  }

  const isLoading = isUserLoading || isProfileLoading;
  
  const progress = (STUDY_DURATION - remainingTime) / STUDY_DURATION;
  const circleSize = 60 + (140 * progress); // Grows from 60px to 200px

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
      
      <Card className="shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Registrar Estudio</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
          {!isStudying ? (
            <div className="w-full space-y-4 px-4">
              <Input 
                placeholder="¿Qué vas a estudiar?" 
                value={studySubject}
                onChange={(e) => setStudySubject(e.target.value)}
                disabled={isLoading}
              />
              <Button size="lg" className="w-full" onClick={handleStartStudy} disabled={isLoading || !studySubject}>
                <Play className="mr-2 h-5 w-5"/>
                Iniciar Sesión de 25 min
              </Button>
            </div>
          ) : (
             <div className="relative w-full flex flex-col items-center justify-center gap-4">
                <div 
                    className="rounded-full bg-primary transition-all duration-1000 ease-in-out shadow-glow" 
                    style={{ 
                        width: `${circleSize}px`, 
                        height: `${circleSize}px`,
                        boxShadow: `0 0 ${10 + progress * 50}px 0px hsl(var(--primary) / ${0.7 + progress * 0.3})`
                    }}
                ></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-6xl font-bold font-mono text-primary-foreground drop-shadow-lg">{formatTime(remainingTime)}</p>
                    <p className="text-foreground text-sm font-semibold bg-background/50 backdrop-blur-sm px-2 py-1 rounded-md mt-2">{studySubject}</p>
                </div>
                <Button size="lg" className="w-3/4 mt-[220px]" onClick={() => handleStopStudy(false)} disabled={isLoading}>
                    <Square className="mr-2 h-5 w-5"/>
                    Detener y Guardar
                </Button>
             </div>
          )}

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <span>Actividad Reciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentActivities || recentActivities.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay actividad reciente. ¡Empieza a estudiar!</p>
          ) : (
            <ul className="space-y-4">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                       <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{activity.subject}</p>
                      <p className="text-sm text-muted-foreground">{formatDuration(activity.durationMinutes)}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">+{xpFromDuration(activity.durationMinutes).toLocaleString('es-ES')} Puntos</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
